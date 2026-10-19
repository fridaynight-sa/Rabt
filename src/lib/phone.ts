// Phone numbers are stored in international format (E.164), e.g. +966512345678.

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

function toAsciiDigits(value: string): string {
  return value.replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

/**
 * Turns what people type (05xxxxxxxx, 9665xxxxxxxx, +966 5x xxx xxxx, Arabic digits...)
 * into E.164. Returns null when it is not a valid number.
 */
export function normalizePhone(input: string): string | null {
  let value = toAsciiDigits(input.trim()).replace(/[\s\-().]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;

  // Saudi mobile numbers written locally.
  if (/^05\d{8}$/.test(value)) return `+966${value.slice(1)}`;
  if (/^5\d{8}$/.test(value)) return `+966${value}`;
  if (/^9665\d{8}$/.test(value)) return `+${value}`;

  if (value.startsWith("+966")) {
    return /^\+9665\d{8}$/.test(value) ? value : null;
  }
  if (/^\+[1-9]\d{7,14}$/.test(value)) return value;
  return null;
}

/** True when the text looks like a phone number rather than an email. */
export function looksLikePhone(input: string): boolean {
  return !input.includes("@") && /^[+\d\s\-()٠-٩۰-۹]+$/.test(input.trim());
}

/** WhatsApp chat link for an E.164 number. */
export function whatsappLink(e164: string, text?: string): string {
  const url = new URL(`https://wa.me/${e164.replace(/^\+/, "")}`);
  if (text) url.searchParams.set("text", text);
  return url.toString();
}
