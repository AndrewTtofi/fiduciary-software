import type { APIRequestContext, Page } from "@playwright/test";

export async function resetAndSeed(req: APIRequestContext) {
  const res = await req.post("/api/test/reset?seed=1");
  if (!res.ok()) throw new Error(`reset failed: ${res.status()} ${await res.text()}`);
}

export async function signInAsStaff(page: Page) {
  await page.goto("/login");
  await page.locator("input[name='email']").fill("staff@oro.local");
  await page.locator("input[name='password']").fill("oroDemo!1");
  // Click the submit button inside the sign-in form (not the tab button)
  await page.locator("form button[type='submit']").click();
  await page.waitForURL(/\/admin/);
}

export async function registerProspect(page: Page, email: string) {
  await page.goto("/login");
  // Switch to Create Account tab (the auth-tabs button, not the submit button)
  await page.getByRole("button", { name: /create account/i }).click();
  await page.locator("input[name='fullName']").fill("Test Prospect");
  await page.locator("input[name='email']").fill(email);
  await page.locator("input[name='phoneNumber']").fill("99123456");
  await page.locator("input[name='password']").fill("oroTest!1");
  // Submit button inside the form
  await page.locator("form button[type='submit']").click();
  // dev auto-verifies + lands on /onboarding
  await page.waitForURL(/\/onboarding/);
}
