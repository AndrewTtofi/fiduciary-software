import { test, expect } from "@playwright/test";
import { resetAndSeed, registerProspect } from "./_fixtures";

test.beforeEach(async ({ request }) => {
  await resetAndSeed(request);
});

test("complete 3-step onboarding wizard → success page with reference number", async ({ page }) => {
  await registerProspect(page, "onboard.test@example.com");

  // ── Step 1: Select service ────────────────────────────────────────────────
  await page.waitForURL(/\/onboarding$/, { timeout: 15000 });
  // Click the Company Formation service card (aria-pressed button with that text)
  await page.getByRole("button", { name: /company formation/i }).click();
  // The "Continue" button at the bottom of the service picker
  await page.getByRole("button", { name: /^continue$/i }).click();

  // ── Step 2: Details ───────────────────────────────────────────────────────
  await page.waitForURL(/\/onboarding\/details/, { timeout: 15000 });

  // Personal section — fullLegalName is pre-filled from the account name
  await page.locator("input[type='date']").fill("1985-03-22");
  // nationality select (first select on the page)
  await page.locator("select").nth(0).selectOption("Cyprus");
  // residenceCountry (second select)
  await page.locator("select").nth(1).selectOption("Cyprus");
  // address textarea
  await page.locator("textarea").first().fill("10 Makarios Ave, Nicosia, 1065");
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Intent section
  await page.locator("textarea").first().fill(
    "A technology consulting firm offering full-stack software development and IT advisory services to European financial institutions with a focus on digital transformation and compliance tooling.",
  );
  await page.locator("select").nth(0).selectOption("50K-200K");   // expectedTurnover
  await page.locator("select").nth(1).selectOption("immediately"); // timeline
  await page.locator("select").nth(2).selectOption("google");      // source
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Specifics section (company_formation fields)
  await page.locator("input[placeholder*='Desired name']").fill("TechVenture Ltd");
  await page.locator("input[type='number']").first().fill("2");
  // Toggle "Need nominee services?" → No
  await page.getByRole("button", { name: /^no$/i }).first().click();
  await page.locator("input[placeholder*='IT Services']").fill("Software Development");
  await page.getByRole("button", { name: /continue to documents/i }).click();

  // ── Step 3: Documents ─────────────────────────────────────────────────────
  await page.waitForURL(/\/onboarding\/documents/, { timeout: 15000 });

  // Submit via API directly (no file upload needed in tests)
  const submitRes = await page.request.post("/api/onboarding/submit", {
    data: {
      services: ["company_formation"],
      fullLegalName: "Test Prospect",
      dateOfBirth: "1985-03-22",
      nationality: "Cyprus",
      residenceCountry: "Cyprus",
      address: "10 Makarios Ave, Nicosia, 1065",
      businessDescription: "A technology consulting firm offering full-stack software development and IT advisory services to European financial institutions with a focus on digital transformation and compliance tooling.",
      expectedTurnover: "50K-200K",
      timeline: "immediately",
      source: "google",
      proposedCompanyName: "TechVenture Ltd",
      shareholderCount: 2,
      nomineeServices: false,
      businessActivity: "Software Development",
    },
  });
  expect(submitRes.ok(), `submit API returned ${submitRes.status()}: ${await submitRes.text()}`).toBeTruthy();

  // Navigate to success page
  await page.goto("/onboarding/success");
  await page.waitForURL(/\/onboarding\/success/, { timeout: 15000 });

  // Verify success page content
  await expect(page.getByRole("heading", { name: /application submitted/i })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/reference number/i)).toBeVisible();
});
