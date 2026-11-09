import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { SEED_PASSWORD, confirmationLink, login, totp, uniqueEmail } from "./helpers";

// One story, step by step, the way real people use the site:
// a visitor searches, a provider signs up and posts an ad with a photo,
// a merchant signs up, rates and reports, and an admin hides the ad.
test.describe.configure({ mode: "serial" });

const PHOTO = path.resolve("public/og.png");
const stamp = Date.now().toString().slice(-6);
const listingTitle = `مكينة اختبار ${stamp}`;
let listingUrl = "";
let providerUrl = "";

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  return context.newPage();
}

test("visitor finds sample listings from the home page", async ({ page }) => {
  await page.goto("/");
  // Typed without hamza or taa marbuta: search should still match.
  const box = page.getByLabel("وش تدوّر عليه؟");
  await box.fill("مكينه اسبريسو");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/search/);
  await expect(page.getByText("مكينة إسبريسو مجموعتين").first()).toBeVisible();
});

test("provider signs up, confirms the email and posts an ad with a photo", async ({ browser }) => {
  const page = await newPage(browser);
  const email = uniqueEmail("provider");

  await page.goto("/signup/provider");
  await page.getByLabel("الاسم", { exact: true }).fill(`مورد اختبار ${stamp}`);
  await page.getByLabel("المدينة").selectOption({ index: 1 });
  await page.getByLabel("الإيميل").fill(email);
  await page.getByLabel("رقم الواتساب").fill(`0551${stamp}`);
  await page.getByLabel("الخدمات أو المنتجات اللي تقدمها").fill("معدات مقاهي وصيانة");
  await page.getByLabel("كلمة المرور").fill("Test-pass-123");
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page).toHaveURL(/\/signup\/check-email/);

  await page.goto(await confirmationLink(email));
  await expect(page).toHaveURL(/\/dashboard\/provider/);

  // Page details.
  await page.goto("/dashboard/provider/profile");
  await page.getByLabel("وصف مختصر عن نشاطك").fill("نجهز المقاهي من الصفر.");
  await page.getByRole("button", { name: "حفظ التعديلات" }).click();
  await expect(page.getByText("انحفظت التعديلات.")).toBeVisible();

  // Work photo: shrunk in the browser, stored in Supabase Storage.
  await page.goto("/dashboard/provider/portfolio");
  await page.locator('input[type="file"]').setInputFiles(PHOTO);
  const portfolioPhoto = page.locator("ul img").first();
  await expect(portfolioPhoto).toBeVisible();
  await expect
    .poll(() => portfolioPhoto.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);

  // An ad with a photo.
  await page.goto("/dashboard/provider/listings/new");
  await page.getByLabel("عنوان الإعلان").fill(listingTitle);
  await page
    .getByLabel("الوصف", { exact: true })
    .fill("مكينة بحالة ممتازة مع ضمان، للاختبار الآلي.");
  await page.getByLabel("السعر بالريال").fill("9000");
  await page.getByLabel("المدينة").selectOption({ index: 1 });
  await page.getByLabel("الفئة").selectOption({ index: 1 });
  await page.getByText("واتساب", { exact: true }).click();
  await page.getByRole("button", { name: "حفظ ومتابعة للصور" }).click();
  await expect(page).toHaveURL(/\/dashboard\/provider\/listings\/[0-9a-f-]{36}/);
  const id = /listings\/([0-9a-f-]{36})/.exec(page.url())![1];
  listingUrl = `/listings/${id}`;

  await page.locator('input[type="file"]').setInputFiles(PHOTO);
  await expect(page.locator("ul img").first()).toBeVisible();

  // The public ad shows the photo and links to the provider page.
  await page.goto(listingUrl);
  await expect(page.getByRole("heading", { name: listingTitle })).toBeVisible();
  const link = page.getByRole("link", { name: "صفحة المورد وكل إعلاناته" });
  providerUrl = (await link.getAttribute("href"))!;
  expect(providerUrl).toMatch(/^\/providers\//);
  await page.context().close();
});

test("merchant signs up, rates the provider and reports the ad", async ({ browser }) => {
  const page = await newPage(browser);
  const email = uniqueEmail("merchant");

  await page.goto("/signup/merchant");
  await page.getByLabel("الاسم", { exact: true }).fill(`تاجر اختبار ${stamp}`);
  await page.getByLabel("الإيميل").fill(email);
  await page.getByLabel("كلمة المرور").fill("Test-pass-123");
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page).toHaveURL(/\/signup\/check-email/);
  await page.goto(await confirmationLink(email));
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto(providerUrl);
  await expect(page.getByText("نجهز المقاهي من الصفر.")).toBeVisible();
  // The star radios are visually hidden behind the star icons.
  await page.getByRole("radio", { name: /^5 من 5/ }).check({ force: true });
  await page.getByLabel("تعليقك").fill("تعامل راقي واختبار ناجح");
  await page.getByRole("button", { name: "إرسال التقييم" }).click();
  await expect(page.getByText("شكراً، انحفظ تقييمك.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("تعامل راقي واختبار ناجح")).toBeVisible();

  await page.goto(listingUrl);
  await page.getByRole("button", { name: /إبلاغ/ }).first().click();
  await page.getByText("احتيال أو نصب").click();
  await page.getByRole("button", { name: "إرسال البلاغ" }).click();
  await expect(page.getByText("شكراً، وصل بلاغك للإدارة.")).toBeVisible();
  await page.context().close();
});

test("admin sets up the authenticator app and hides the ad", async ({ browser }) => {
  const page = await newPage(browser);
  await login(page, "admin@example.com", SEED_PASSWORD);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/mfa/);
  await page.getByRole("button", { name: "ابدأ الإعداد" }).click();
  const secret = (await page.locator("span.font-mono").textContent())!.trim();
  await page.getByLabel("الرمز من التطبيق").fill(totp(secret));
  await page.getByRole("button", { name: "تفعيل" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/reports");
  await expect(page.getByText("احتيال أو نصب").first()).toBeVisible();

  await page.goto(`/admin/listings?q=${encodeURIComponent(listingTitle)}`);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "إخفاء" }).click();
  await expect(page.getByText("مخفي", { exact: true })).toBeVisible();
  await page.context().close();

  // A visitor can no longer open it.
  const visitor = await newPage(browser);
  const response = await visitor.goto(listingUrl);
  expect(response?.status()).toBe(404);
  await visitor.context().close();
});
