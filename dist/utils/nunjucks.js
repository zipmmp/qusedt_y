import nunjucks from "nunjucks";

// 🛠️ كلاس fallback للكيز الناقصة
class FallbackUndefined {
  public readonly prop?: string;
  public readonly lookupStr?: string;

  constructor(prop?: string, lookupStr?: string) {
    this.prop = prop;
    this.lookupStr = lookupStr;
  }

  toString(): string {
    return `{{ ${this.lookupStr || this.prop || "MISSING_KEY"} }}`;
  }
}

// إنشاء Environment
const env = new nunjucks.Environment(undefined, { autoescape: false, noCache: false, throwOnUndefined: false, lstripBlocks: true });
env.addFilter("fallback", function (value: any, keyName?: string) {

  if (value === null || value === undefined || value === "") {
    return `{{ ${keyName} }}`; // رجع placeholder
  }
  return `${value}`;
}, false);

// تفعيل FallbackUndefined
(env as any).opts.undefined = FallbackUndefined;
(env as any).opts.null = FallbackUndefined;

// 🛠️ دالة تفكّك flat keys -> nested object
function unflatten(obj: Record<string, any>) {
  const result: any = {};
  for (const key in obj) {
    key.split(".").reduce((acc, part, i, arr) => {
      if (i === arr.length - 1) {
        acc[part] = obj[key];
      } else {
        acc[part] = acc[part] || {};
      }
      return acc[part];
    }, result);
  }
  return result;
}
function addFallbackToTemplate(template: string): string {
  return template.replace(/{{\s*([^}|]+)(.*?)}}/g, (match, key, rest) => {
    // لو فيه fallback لا تلمسه
    if (rest.includes("|fallback")) {
      return match;
    }
    const trimmedKey = key?.trim() ?? "BAD_KEY";
    return `{{ ${trimmedKey}${rest} |fallback("${trimmedKey}") }}`;
  });
}
/**
 * generateMessage
 * @param template {string} القالب النصي بـ Nunjucks
 * @param data {object} البيانات JSON
 * @returns {string} الرسالة الناتجة
 */
export function replaceMessageKeysNunjucks(
  template: string,
  data: Record<string, any>,
  returnNull = false,
): string {
  try {
    return env.renderString(addFallbackToTemplate(template), unflatten(data));
  } catch (err) {
    console.error("Error rendering template:", err);
    if (returnNull) return null as any;
    else return "⚠️ Error rendering template";
  }
}