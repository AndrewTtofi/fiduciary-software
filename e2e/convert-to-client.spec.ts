import { test, expect } from "@playwright/test";
import { resetAndSeed } from "./_fixtures";

test.beforeEach(async ({ request }) => {
  await resetAndSeed(request);
});

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[name='email']").fill(email);
  await page.locator("input[name='password']").fill(password);
  await page.locator("form button[type='submit']").click();
}

test("prospect → staff approves + compliance cleared → staff converts → client sees dashboard", async ({ page, request }) => {
  const EMAIL = "convert.prospect@example.com";

  // ── 1. Register prospect ──────────────────────────────────────────────────
  const regRes = await request.post("/api/auth/register", {
    data: {
      fullName: "Convert Prospect",
      email: EMAIL,
      phoneCountry: "+357",
      phoneNumber: "99111222",
      password: "oroTest!1",
    },
  });
  expect(regRes.ok(), `register: ${regRes.status()}`).toBeTruthy();

  // ── 2. Sign in as prospect and complete onboarding via API ────────────────
  await signIn(page, EMAIL, "oroTest!1");
  await page.waitForURL(/\/onboarding/, { timeout: 15000 });

  const servicesRes = await page.request.post("/api/onboarding/services", {
    data: { services: ["company_formation"] },
  });
  expect(servicesRes.ok(), `services: ${servicesRes.status()}`).toBeTruthy();

  const submitRes = await page.request.post("/api/onboarding/submit", {
    data: {
      services: ["company_formation"],
      fullLegalName: "Convert Prospect",
      dateOfBirth: "1980-01-01",
      nationality: "Cyprus",
      residenceCountry: "Cyprus",
      address: "1 Convert Street, Nicosia, 1000",
      businessDescription: "A financial technology firm specialising in payment processing solutions for European markets with regulatory compliance and cross-border transaction capabilities across multiple regions.",
      expectedTurnover: "500K-1M",
      timeline: "immediately",
      source: "referral",
      proposedCompanyName: "ConvertCo Ltd",
      shareholderCount: 1,
      nomineeServices: false,
      businessActivity: "Fintech",
    },
  });
  expect(submitRes.ok(), `submit: ${submitRes.status()}`).toBeTruthy();

  // ── 3. Sign in as staff ───────────────────────────────────────────────────
  await signIn(page, "staff@oro.local", "oroDemo!1");
  await page.waitForURL(/\/admin/, { timeout: 15000 });

  // ── 4. Approve the submission ─────────────────────────────────────────────
  await page.goto("/admin/submissions");
  await page.getByText("Convert Prospect").first().click();
  await page.waitForURL(/\/admin\/submissions\/.+/, { timeout: 10000 });

  await page.getByRole("button", { name: /approve submission/i }).click();
  await page.waitForTimeout(1500);

  // ── 5. Clear compliance via test endpoint ─────────────────────────────────
  const clearRes = await request.post("/api/test/setup-client", {
    data: { email: EMAIL },
  });
  expect(clearRes.ok(), `clear compliance: ${clearRes.status()} ${await clearRes.text()}`).toBeTruthy();

  // ── 6. Convert via staff UI ───────────────────────────────────────────────
  await page.goto("/admin/clients");
  await page.getByRole("button", { name: /convert from prospect/i }).click();
  await page.waitForSelector("text=Convert from Prospect", { timeout: 5000 });

  // Should now show "✓ Cleared" badge and a "Make Client" button
  await expect(page.getByText(/cleared/i).first()).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: /make client/i }).first().click();
  await page.waitForURL(/\/admin\/clients\/.+/, { timeout: 15000 });

  // ── 7. Log in as the converted client ─────────────────────────────────────
  await signIn(page, EMAIL, "oroTest!1");
  await page.waitForURL(/\/app/, { timeout: 15000 });
  await page.goto("/app/dashboard");

  // ClientDashboard shows "Active services" stat card
  await expect(page.getByText(/active services/i)).toBeVisible({ timeout: 10000 });
});
