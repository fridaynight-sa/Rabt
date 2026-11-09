import { createHmac } from "node:crypto";
import { expect, type Page } from "@playwright/test";

/** Local Supabase's test mailbox (Mailpit). */
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

/** The password of every account in supabase/seed.sql. */
export const SEED_PASSWORD = "Sample-pass-1";

export function uniqueEmail(kind: string) {
  return `e2e-${kind}-${Date.now()}@example.com`;
}

/** Waits for the sign-up email and returns its confirmation link. */
export async function confirmationLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    );
    const { messages = [] } = (await search.json()) as { messages?: { ID: string }[] };
    const id = messages[0]?.ID;
    if (id) {
      const message = (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()) as {
        HTML: string;
      };
      const href = /href="([^"]*\/auth\/confirm\?[^"]+)"/.exec(message.HTML)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`no confirmation email for ${email}`);
}

/** The 6-digit code an authenticator app would show for this secret (RFC 6238). */
export function totp(base32Secret: string, now = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of base32Secret.replace(/=+$/, "").toUpperCase()) {
    const v = alphabet.indexOf(c);
    if (v >= 0) bits += v.toString(2).padStart(5, "0");
  }
  const bytes = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)));
  const hmac = createHmac("sha1", bytes).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("الإيميل أو رقم الجوال").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
