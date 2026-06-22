// Thin wrapper so `prisma db seed` (and `npm run prisma:seed` via tsx) runs
// the same code path as the compiled production seed in `dist-worker/`.
import { runSeed } from "../src/worker/seed";

runSeed()
  .then((r) => {
    console.log("[seed] complete:", r.accounts);
  })
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exit(1);
  });
