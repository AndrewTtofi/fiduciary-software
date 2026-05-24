import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/lib/services/**", "src/lib/providers/**", "src/app/api/**", "src/worker/**"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "src/**/__tests__/**/*.test.ts",
            "src/**/*.test.ts",
          ],
          exclude: [
            "src/app/api/**/__tests__/**",
            "src/worker/__tests__/**",
            "src/lib/services/__tests__/screening.test.ts",
            "src/lib/services/__tests__/client-portal.test.ts",
            "e2e/**",
          ],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: [
            "src/app/api/**/__tests__/route.test.ts",
            "src/worker/__tests__/**/*.test.ts",
            "src/lib/services/__tests__/screening.test.ts",
            "src/lib/services/__tests__/client-portal.test.ts",
          ],
          environment: "node",
          testTimeout: 60000,
          hookTimeout: 60000,
        },
      },
    ],
  },
});
