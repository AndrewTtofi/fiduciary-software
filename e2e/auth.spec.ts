import { test, expect } from "@playwright/test";
import { resetAndSeed } from "./_fixtures";

test.beforeEach(async ({ request }) => {
  await resetAndSeed(request);
});

test("register new account → lands on /onboarding", async ({ page }) => {
  await page.goto("/login");

  // Click the "Create Account" tab (second tab in the tab bar, not the submit button)
  await page.locator(".flex.border-b button").nth(1).click();

  // Fill in registration form using name attributes (labels are not associated via htmlFor)
  await page.locator("input[name='fullName']").fill("John Doe");
  await page.locator("input[name='email']").fill("john.doe@example.com");
  await page.locator("input[name='phoneNumber']").fill("99123456");
  await page.locator("input[name='password']").fill("oroTest!1");

  // Submit via the form submit button
  await page.locator("form button[type='submit']").click();

  // Dev auto-verifies; should land on /onboarding
  await page.waitForURL(/\/onboarding/, { timeout: 15000 });
  expect(page.url()).toContain("/onboarding");
});

test("sign in with seeded staff account → lands on /admin", async ({ page }) => {
  await page.goto("/login");

  await page.locator("input[name='email']").fill("staff@oro.local");
  await page.locator("input[name='password']").fill("oroDemo!1");
  // Submit via the form submit button
  await page.locator("form button[type='submit']").click();

  await page.waitForURL(/\/admin/, { timeout: 15000 });
  expect(page.url()).toContain("/admin");
});
