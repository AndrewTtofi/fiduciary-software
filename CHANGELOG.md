# Changelog

All notable changes to this platform are recorded here.

Versioning is **[semantic](https://semver.org/)**. From v1.0.0 onward this file
is maintained by [release-please](https://github.com/googleapis/release-please)
from [Conventional Commits](https://www.conventionalcommits.org/) — **do not edit
it by hand.** Write good commit messages (`feat:` → minor, `fix:` → patch,
`feat!:` / `BREAKING CHANGE:` → major) and release-please updates the versions
and sections below via its release PR. Sections above `## [1.0.0]` are
auto-generated; sections at and below it are the curated history.

---

## [1.1.0](https://github.com/AndrewTtofi/fiduciary-software/compare/oro-v1.0.0...oro-v1.1.0) (2026-06-22)


### ✨ Features

* **activity:** add client-page mutation actions + new entity types ([0d87492](https://github.com/AndrewTtofi/fiduciary-software/commit/0d874920d939a0e280ee4a354c88a15f2a5797d8))
* **activity:** add client.self_profile_updated action ([a656132](https://github.com/AndrewTtofi/fiduciary-software/commit/a6561320c7fe639a9969c7e6c8a65161c5122ccd))
* **admin:** compliance suite + documents/e-sign + connect & API (new prototype) ([321d9b2](https://github.com/AndrewTtofi/fiduciary-software/commit/321d9b24fc39895cbe2192986a491547fca16663))
* AI Advisor chat + shared Icon/services modules (new prototype) ([9bec570](https://github.com/AndrewTtofi/fiduciary-software/commit/9bec570e2d1668b3841fbea9b9339cfcb282a715))
* align admin to prototype (dashboard, messages inbox, AML inline) ([3607b75](https://github.com/AndrewTtofi/fiduciary-software/commit/3607b75303c2b67f93f144d4e5e575d50b7c5803))
* **api:** client PATCH accepts profile fields + primary staff ([b6cda24](https://github.com/AndrewTtofi/fiduciary-software/commit/b6cda24b58eba9a6f854e9649782d04d5c627fb9))
* **api:** client services POST/PATCH/DELETE ([ccbf260](https://github.com/AndrewTtofi/fiduciary-software/commit/ccbf2604e18e4f6c93a231ea14a2a826047b24a2))
* **api:** extend /api/account/profile with address + taxResidency ([82e1270](https://github.com/AndrewTtofi/fiduciary-software/commit/82e1270378a93998d06e17e7dc594ed1090c5b26))
* **api:** key-date PATCH/DELETE ([38fe2d2](https://github.com/AndrewTtofi/fiduciary-software/commit/38fe2d212cbe24d6bc2e8d29885b239fa0c29a2c))
* **api:** POST /api/account/documents (client upload with ownership check) ([af65421](https://github.com/AndrewTtofi/fiduciary-software/commit/af6542109dc41a37874a571f35506eeb8db7e20e))
* **api:** POST /api/account/messages ([e4f3aac](https://github.com/AndrewTtofi/fiduciary-software/commit/e4f3aace4bc0b85d9bdacc9136cb2f0820d69c5e))
* **api:** staff document upload + status + delete ([fb1f598](https://github.com/AndrewTtofi/fiduciary-software/commit/fb1f59876e663a470731ed6b9c22b394489fb2fb))
* client detail page — full functionality + messaging + doc requests ([64fdb7a](https://github.com/AndrewTtofi/fiduciary-software/commit/64fdb7a2b3e0d7e2fc13c55ccad7f653eeb74dca))
* client portal v1 + CHANGELOG enforcement ([7c5b97d](https://github.com/AndrewTtofi/fiduciary-software/commit/7c5b97d969449a6ee5b5cf68924374c085c574b0))
* **client-portal:** add uploadClientDocument (ownership-checked) ([0f52bb6](https://github.com/AndrewTtofi/fiduciary-software/commit/0f52bb654b9d8562897ef752de152fbaaee87e70))
* **client-portal:** messaging + unified read + self-profile services (TDD) ([64ec381](https://github.com/AndrewTtofi/fiduciary-software/commit/64ec3813c8928826e0a3aed4a87879d1b1a1a153))
* **client-services:** add CRUD service ([7bcad4e](https://github.com/AndrewTtofi/fiduciary-software/commit/7bcad4e69193ec04344ee232b59f4974c73f4957))
* **clients:** add updateClientProfile + updatePrimaryStaff + updateClientStatus services ([682dc81](https://github.com/AndrewTtofi/fiduciary-software/commit/682dc81e18d6d1543eeb8879e4e2d0a0d4f39210))
* **compliance:** add computeRisk scoring function ([b4b25aa](https://github.com/AndrewTtofi/fiduciary-software/commit/b4b25aa548465fd8fae4645aa7023941675bf88a))
* **compliance:** add country-risk lookup table ([17a429c](https://github.com/AndrewTtofi/fiduciary-software/commit/17a429cc605cf2199391721f600d81885a098ec3))
* **compliance:** add hit-dedup helper ([e7dd262](https://github.com/AndrewTtofi/fiduciary-software/commit/e7dd2627c26bc13fb30fd16224a1d340aeeca2db))
* **compliance:** add industry-risk lookup ([3b32deb](https://github.com/AndrewTtofi/fiduciary-software/commit/3b32deb5f33975df71aec947f6f62de954d3d5a8))
* **compliance:** add runScreening service ([b218237](https://github.com/AndrewTtofi/fiduciary-software/commit/b21823729b95fe868755f4874964966e703bb682))
* **compliance:** create ComplianceFile + main_contact on submission ([ef3a1ff](https://github.com/AndrewTtofi/fiduciary-software/commit/ef3a1ff5cbc7487575a7b18f8aa5765b0c5626ee))
* **compliance:** file-scoped API routes (GET, sign-off, risk) ([717d0ae](https://github.com/AndrewTtofi/fiduciary-software/commit/717d0ae16b85cff5300101fb0259e8ce0d9c8f8f))
* **compliance:** hit + review-task API routes ([2355e17](https://github.com/AndrewTtofi/fiduciary-software/commit/2355e1708e9809893c5faf174e00c0bc15a2c93d))
* **compliance:** hit review (auto-block on sanctions) + risk persist/override ([4b33963](https://github.com/AndrewTtofi/fiduciary-software/commit/4b3396353aacb3f95e589d3f190442f222fb81ab))
* **compliance:** party + KYC + screening + document API routes ([ae5d06d](https://github.com/AndrewTtofi/fiduciary-software/commit/ae5d06d463318b9c217d0a049d9913f14f40574d))
* **compliance:** party CRUD + KYC update services + activity actions ([783860f](https://github.com/AndrewTtofi/fiduciary-software/commit/783860f86ffcf28201246cb536d2e0cc1ac2c210))
* **compliance:** sign-off service + conversion gate ([c35ac28](https://github.com/AndrewTtofi/fiduciary-software/commit/c35ac28e78ad8d884b19689b9d09fe06da2621c8))
* **deploy:** self-hosted CI/CD pipeline for ORO ([5fa5256](https://github.com/AndrewTtofi/fiduciary-software/commit/5fa5256fdb76618f74458783bcf65b388e6f9c26))
* **doc-requests:** API + admin page + form ([870397d](https://github.com/AndrewTtofi/fiduciary-software/commit/870397da180b7f818d5a233c49faf807cb350e14))
* **documents:** add bucketDocument helper ([c7054bc](https://github.com/AndrewTtofi/fiduciary-software/commit/c7054bc30bd89e7e97c1082284c39dd6864e0818))
* **documents:** add status/delete services + DocumentRequest fulfillment seam ([15fe2d5](https://github.com/AndrewTtofi/fiduciary-software/commit/15fe2d5963b52e9f02d90f44fa073e7832782d13))
* **key-dates:** add update + delete services ([966731b](https://github.com/AndrewTtofi/fiduciary-software/commit/966731bd75ce14174fffde35227b6f048b59cede))
* KYC/AML compliance subsystem ([0d874b7](https://github.com/AndrewTtofi/fiduciary-software/commit/0d874b7cca06206081c430f50cfb283c37e5da92))
* **messages:** add sendMessage + listThread (with email side-effect) ([461c858](https://github.com/AndrewTtofi/fiduciary-software/commit/461c8586e62206f5ccd7c99b9e6fea55d789f5f9))
* **messages:** API + admin thread page + composer ([1976ab7](https://github.com/AndrewTtofi/fiduciary-software/commit/1976ab7027fa706e1335beb72ed8aaef88b8cba7))
* **notify:** delta-only Discord deploy notes + forum tags + white-label copy ([a1d7a57](https://github.com/AndrewTtofi/fiduciary-software/commit/a1d7a573c62c149127aad9d4d176ab6833608d02))
* **notify:** delta-only Discord deploy notes + forum tags + white-label copy ([9200928](https://github.com/AndrewTtofi/fiduciary-software/commit/92009288974e7c9939475b6dfa65de3b907045e5))
* **notify:** white-label COMPANY_NAME variable for deploy notifications ([3457c50](https://github.com/AndrewTtofi/fiduciary-software/commit/3457c502c9be5f21311e7dbfdaaf61fc5ca66eca))
* partner-network marketplace + client applications (new prototype) ([2583954](https://github.com/AndrewTtofi/fiduciary-software/commit/25839548067e7f77a198b43a6bbe971e34d1b96d))
* **portal:** application page notice for converted clients ([f5ccbb1](https://github.com/AndrewTtofi/fiduciary-software/commit/f5ccbb1ea601620bbaf67efd2a1beba3ec0b1016))
* **portal:** per-folder documents + request fulfillment + arbitrary upload ([6794dde](https://github.com/AndrewTtofi/fiduciary-software/commit/6794ddea1a9b7f95731127b94f7acd0b8e9c6882))
* **portal:** role-aware dashboard (ClientDashboard for converted clients) ([c73c633](https://github.com/AndrewTtofi/fiduciary-software/commit/c73c633bf06cfecc16405ff0c9886260963b4cd4))
* **portal:** settings form gains Company section for clients ([7af37e9](https://github.com/AndrewTtofi/fiduciary-software/commit/7af37e93a49d53b711aaa272dc70b1a69cc095bb))
* **portal:** unified messages read + new /api/account/messages composer ([f752cf7](https://github.com/AndrewTtofi/fiduciary-software/commit/f752cf7109e662987b361633ca6a4bcc012f92f1))
* **pricing:** platform pricing with working monthly/annual toggle (new prototype) ([7db0d13](https://github.com/AndrewTtofi/fiduciary-software/commit/7db0d136f3a05ab04a765e8db3007121a9361a37))
* provision super-admin from GitHub secrets, injected into prod .env ([3b25ce0](https://github.com/AndrewTtofi/fiduciary-software/commit/3b25ce08b5ec4ed22d1aa30e9fa9a61e3654c6fe))
* realign partner portal to the light prototype shell ([685b3a9](https://github.com/AndrewTtofi/fiduciary-software/commit/685b3a91e4f985a92b9e6f3858222dc732c3642e))
* **schema:** add KYC/AML compliance models ([9a01202](https://github.com/AndrewTtofi/fiduciary-software/commit/9a0120219a70e6a5066749d2808cef1365662b2c))
* **schema:** extend Client + Document, add DocumentRequest ([18bfc5d](https://github.com/AndrewTtofi/fiduciary-software/commit/18bfc5db79161d96dcce9d995b1e82ffb326e913))
* **screening:** add ScreeningProvider interface + env wiring ([3dafe13](https://github.com/AndrewTtofi/fiduciary-software/commit/3dafe13ec3d00d848850cb514bb98c62f08bef08))
* **screening:** implement OpenSanctionsProvider with retry + threshold ([7ef44fe](https://github.com/AndrewTtofi/fiduciary-software/commit/7ef44fe550e52bf488a3bab38912547f2702809f))
* split admin into platform-admin (settings) vs staff-admin (ops) ([a4ba35e](https://github.com/AndrewTtofi/fiduciary-software/commit/a4ba35e3f672cfdc62f85f7027741fbf47ea3c0c))
* super-admin-only plan tier control ([337439c](https://github.com/AndrewTtofi/fiduciary-software/commit/337439c76ede82a8aba06311138978a8b460fcce))
* super-admin-only plan tier control ([9e30f1d](https://github.com/AndrewTtofi/fiduciary-software/commit/9e30f1d501a3ca42368b24f1b132873d7a6e8638))
* **ui:** add Compliance to admin nav ([d6f7c02](https://github.com/AndrewTtofi/fiduciary-software/commit/d6f7c0203f5d4f515b24828c4fd8879b77e90fd1))
* **ui:** compliance pages (file, party, submissions, tasks) ([bdaa487](https://github.com/AndrewTtofi/fiduciary-software/commit/bdaa487a2828231892fdfa6f89d097d6b6641545))
* **ui:** ComplianceBar (status + risk + link to /compliance) ([5a1b4ef](https://github.com/AndrewTtofi/fiduciary-software/commit/5a1b4ef3e56e2fa1a5bf2db266b35c06ce864fa4))
* **ui:** ComplianceDashboard + RiskPanel + PartiesTable + AddParty + SignOff components ([92ce505](https://github.com/AndrewTtofi/fiduciary-software/commit/92ce505f8c1aad8cad901eaf0cc9ae848e81a9ce))
* **ui:** convert modal shows compliance status + gates conversion ([5525df3](https://github.com/AndrewTtofi/fiduciary-software/commit/5525df39118cfbaea594641f35e59fe2e9d39455))
* **ui:** EditableClientHeader (inline edit for profile fields) ([b47e716](https://github.com/AndrewTtofi/fiduciary-software/commit/b47e7165635e53f53e6c2496074babcf9924a1f5))
* **ui:** KeyDatesSection + KeyDateRowClient (edit/complete/delete/filter) ([a5f144e](https://github.com/AndrewTtofi/fiduciary-software/commit/a5f144e9c987e0289b95fb9ab7914106fe8ffe68))
* **ui:** luxe pass — Mediterranean private-bank aesthetic + Client tabs ([fead205](https://github.com/AndrewTtofi/fiduciary-software/commit/fead205e1da4a52921c9cd9267262ed6eb7f86b4))
* **ui:** per-folder Documents UI + DocumentRow + UploadButton ([011f677](https://github.com/AndrewTtofi/fiduciary-software/commit/011f677c06486f482f69c56b9dc611fa14f8cb5c))
* **ui:** Quiet Authority redesign — foundation (tokens, type, components) ([4024581](https://github.com/AndrewTtofi/fiduciary-software/commit/40245817c699ce4642ba5bae4cd63e1ff312923c))
* **ui:** ReassignModal replaces alert() in ClientStatusPanel ([4b68987](https://github.com/AndrewTtofi/fiduciary-software/commit/4b68987d7765de34d6395092484abde7cf73e275))
* **ui:** rewire client page to new editable components ([87c50cb](https://github.com/AndrewTtofi/fiduciary-software/commit/87c50cb2a2ce2ac3eb738c40dbdead15ed6b0a88))
* **ui:** ServicesEngagedList + inline edit + AddServiceModal ([7afe9f0](https://github.com/AndrewTtofi/fiduciary-software/commit/7afe9f07021654df7a6ec644054cb65e5da9d64f))
* **worker:** backfill on boot + register compliance cron jobs ([07325d5](https://github.com/AndrewTtofi/fiduciary-software/commit/07325d5a7ca0bb663676181935f736712ab78f88))
* **worker:** daily periodic-review reminder job ([fa07961](https://github.com/AndrewTtofi/fiduciary-software/commit/fa07961f5703ded86238f9e0742db20c3019c5d6))
* **worker:** hourly auto re-screening job ([72f05c7](https://github.com/AndrewTtofi/fiduciary-software/commit/72f05c78a6b9904cc5a9eba5de3ec1f13812a77a))


### 🐛 Bug Fixes

* **auth:** key middleware cookie security to AUTH_URL scheme, not NODE_ENV ([55b5027](https://github.com/AndrewTtofi/fiduciary-software/commit/55b5027e1622e8f4fd84a8152f03953f7e822a30))
* **build:** make tsconfig.worker.json TypeScript 6 compatible ([8475d37](https://github.com/AndrewTtofi/fiduciary-software/commit/8475d37847b584241050a1d08e977236268f5c5a))
* **build:** restore Docker build/deploy broken by TS6 (worker tsconfig) ([9185170](https://github.com/AndrewTtofi/fiduciary-software/commit/91851702b7013059c86f794513d63cdd11d1ef5b))
* **ci:** make lint + typecheck pass ([ce1a829](https://github.com/AndrewTtofi/fiduciary-software/commit/ce1a829b76ab15aadb5f35b2618a1be4f2486360))
* **client-page:** final-review findings ([f1bcc61](https://github.com/AndrewTtofi/fiduciary-software/commit/f1bcc61d617a5f669dedefec959c472db7958e0d))
* **compliance:** final-review findings ([6e58cc9](https://github.com/AndrewTtofi/fiduciary-software/commit/6e58cc9cf740ce3092a3a74c5a54d554972e9d2e))
* **deploy:** db push in deploy-oro.sh (repo ships no migrations) ([f9f094e](https://github.com/AndrewTtofi/fiduciary-software/commit/f9f094e4d33b3ad5a58f95355b8712605eb6f74b))
* **deps:** bump nodemailer to ^7 to satisfy @auth/core peer dep ([6ba1cd5](https://github.com/AndrewTtofi/fiduciary-software/commit/6ba1cd59adc94f329c776b438901ad365e2458b4))
* **docker:** build-time env placeholders + public/ dir ([978f9b2](https://github.com/AndrewTtofi/fiduciary-software/commit/978f9b2a3616b4c7c37e75c6d019be61e283f6b0))
* **docker:** npm ci with --legacy-peer-deps in prod image ([e87a7ce](https://github.com/AndrewTtofi/fiduciary-software/commit/e87a7cefbe6ca48133fdb9f42149551216ad5b07))
* **e2e:** complete auth-tab selector fix + deterministic messaging convert ([816f8be](https://github.com/AndrewTtofi/fiduciary-software/commit/816f8be51ad12b86a725f603470f6c4c3cbc3f85))
* **e2e:** messaging test used client composer selectors on staff page ([f77dae6](https://github.com/AndrewTtofi/fiduciary-software/commit/f77dae672230a72a219a78fd5c6de4e0f7f49e10))
* **e2e:** update auth-tab fixture selector to .auth-tabs; parallelize CI ([ddbc752](https://github.com/AndrewTtofi/fiduciary-software/commit/ddbc75214e2ec61809d9bc7285128d89da88bef5))
* **next16:** bump next-auth to beta.31 (Next 16 peer) + dev image deps ([c1ce6fa](https://github.com/AndrewTtofi/fiduciary-software/commit/c1ce6fa2c2d0583b7aeb8cf0c1b760e1cae984fa))
* **pricing:** show firm service pricing in tenant builds, drop platform toggle ([6f5235d](https://github.com/AndrewTtofi/fiduciary-software/commit/6f5235d50f7430002c6ad10a60c493769b403927))
* **prisma:** drop --skip-generate from db push (removed in Prisma 7) ([553cba2](https://github.com/AndrewTtofi/fiduciary-software/commit/553cba24b92d82c9d8e33a2b09463a4154c9ea1e))
* quote runner-smoke docker step (YAML colon parse error) ([16a1d52](https://github.com/AndrewTtofi/fiduciary-software/commit/16a1d52b35adfd64e19d8b4bc0b2a3a5ecbc10f5))
* **schema:** enforce 1:1 latestScreeningRun via unique FK ([8de07da](https://github.com/AndrewTtofi/fiduciary-software/commit/8de07da5a529970b52a79ec11155b28537f3d356))
* **ts:** make tsconfig TypeScript 6 compatible ([23d5e82](https://github.com/AndrewTtofi/fiduciary-software/commit/23d5e82d284fd06e4f4845d76a445f16f28142a9))


### 📦 Dependencies

* **deps:** bump the prod-minor-patch group across 1 directory with 5 updates ([7a97bd7](https://github.com/AndrewTtofi/fiduciary-software/commit/7a97bd7e816d6ac9d44051443668a2ccf841daa1))
* **deps:** bump the react group across 1 directory with 3 updates ([6e62a50](https://github.com/AndrewTtofi/fiduciary-software/commit/6e62a50577b9f9f9629c19f07eb91e12927c0f80))


### 🛠️ Refactors

* **admin:** unify all admin pages onto the prototype design system ([1d56879](https://github.com/AndrewTtofi/fiduciary-software/commit/1d56879759cf9992eaa1f3ad99c18d7f90fca3c8))


### 📚 Documentation

* add CLAUDE.md LLM guide + switch Discord tags to inline labels ([84d9a8b](https://github.com/AndrewTtofi/fiduciary-software/commit/84d9a8bcf89f84e30a4b0765e39e82e53cffe27c))
* add CLAUDE.md LLM guide; switch Discord tags to inline labels ([8da4f16](https://github.com/AndrewTtofi/fiduciary-software/commit/8da4f1621009118418cc1aa6e811f93a395d7dfc))
* add client portal v1 design spec ([f08f998](https://github.com/AndrewTtofi/fiduciary-software/commit/f08f998f7c5e633d4f768f2c77330d8e704bb894))
* add client portal v1 implementation plan ([3fcee9d](https://github.com/AndrewTtofi/fiduciary-software/commit/3fcee9d4c5c491e3000b38e1af79d3dcf58ea6f8))
* add client-page functional design spec ([156a25d](https://github.com/AndrewTtofi/fiduciary-software/commit/156a25d90a0c25d3be2b28bfb82848c804237d2c))
* add client-page functional implementation plan ([73a4145](https://github.com/AndrewTtofi/fiduciary-software/commit/73a4145af9672be6b259c4675ffca541f988dfdd))
* add KYC/AML compliance design spec ([e29a65e](https://github.com/AndrewTtofi/fiduciary-software/commit/e29a65e8afab8701bbf7e5bd416d83af65228ef1))
* add KYC/AML compliance implementation plan ([ba96de0](https://github.com/AndrewTtofi/fiduciary-software/commit/ba96de03ef8d3340662f9741b554472db69a9a38))
* link wiki from README ([7bff88d](https://github.com/AndrewTtofi/fiduciary-software/commit/7bff88df76048f1605e8faf07dfdd93952acdcd0))
* **spec:** tighten risk bands to 0-2/3-5/6+ to match factor weights ([7ce465e](https://github.com/AndrewTtofi/fiduciary-software/commit/7ce465e44d08b1f5c38fdc8cd6fab980a163852f))
* **wiki:** complete ORO reference (18 chapters + index) ([d524e25](https://github.com/AndrewTtofi/fiduciary-software/commit/d524e256c7edc4fc28a3eeec731c00a4f892c528))


### 🤖 CI/CD

* add on-demand seed-oro workflow (idempotent prod DB seed) ([1cd92af](https://github.com/AndrewTtofi/fiduciary-software/commit/1cd92afd9d88e09e41339cd7d3fcf23b53023c42))
* add one-off diag-login workflow (read-only prod auth diagnostic) ([ad946d3](https://github.com/AndrewTtofi/fiduciary-software/commit/ad946d3135ce0548e3c94692b49a941f5620887f))
* bump Node 20 -&gt; 26 to support undici 8 from testcontainers bump ([704ef49](https://github.com/AndrewTtofi/fiduciary-software/commit/704ef49403b91a0ff92fb5347c0ef578d2dbc1a4))
* bump the actions group across 1 directory with 6 updates ([782928c](https://github.com/AndrewTtofi/fiduciary-software/commit/782928cf06536c0c58b7c93ef2956c187bc7cf96))
* bump the actions group across 1 directory with 6 updates ([2dbd288](https://github.com/AndrewTtofi/fiduciary-software/commit/2dbd288126f5f623b2d7245a4988f3ec953a570b))
* establish semantic versioning via release-please (v1.0.0 baseline) ([6a3d3b4](https://github.com/AndrewTtofi/fiduciary-software/commit/6a3d3b4bf59baf934552ae16ebe32915e6593bbd))
* establish semantic versioning via release-please (v1.0.0 baseline) ([ee2d1bc](https://github.com/AndrewTtofi/fiduciary-software/commit/ee2d1bc5345bf6350260efa1dcf609dd98dd5ab1))
* exempt Dependabot from the changelog gate ([510a723](https://github.com/AndrewTtofi/fiduciary-software/commit/510a7238584187fd1e60231931fc5298cf8edd1f))
* exempt Dependabot from the changelog gate ([71558e9](https://github.com/AndrewTtofi/fiduciary-software/commit/71558e967c4bcb18b23159a0ea8c7fe297a29ddf))
* fix diag-login module resolution (run in web workdir) ([9a21169](https://github.com/AndrewTtofi/fiduciary-software/commit/9a21169274e4d53d2d04cc10d7523dc9ebdae832))
* keep nodemailer at v6, pass --legacy-peer-deps to npm ci ([08493d9](https://github.com/AndrewTtofi/fiduciary-software/commit/08493d98950d9c9d2c7b9f25a292db7920671bf4))
* pass --legacy-peer-deps to npm ci (the actual fix) ([c9621fc](https://github.com/AndrewTtofi/fiduciary-software/commit/c9621fcd90a71fc9f8486ea69c23e9a385f800b8))
* provide dummy DATABASE_URL to prisma validate step ([c377262](https://github.com/AndrewTtofi/fiduciary-software/commit/c377262b9d56c0a3ad2c07ed7fd54e260f4c144c))

## [1.0.0] - 2026-06-22

First production release — the platform on Node 26 / Next.js 16 / Prisma 7 /
TypeScript 6, with the dependency-upgrade and white-label deploy-notification
work below. Everything previously tracked under "Unreleased" is rolled into this
baseline.

### Fixed — Lint quick wins
- Removed 8 unused `eslint-disable` directives (`no-console`/`no-var`, neither rule is enforced under the flat config) across `src/worker/*`, `src/lib/db.ts`, `src/lib/providers/email.ts`, `prisma/seed.ts`.
- Named the anonymous default export in `postcss.config.mjs` (`import/no-anonymous-default-export`).
- Bumped `engines.node` `>=20` → `>=22` to match the actual requirement (undici 8 needs ≥22.19; CI/runtime are on Node 26).
- Lint is now down to the 37 React Compiler warnings (`react-hooks` static-components / set-state-in-effect / purity) deferred during the Next 16 upgrade.

### Changed — Discord deploy notifications: delta-only + change-type labels + white-label wording
- Each deploy now posts **only that deploy's changes** (the CHANGELOG.md additions diffed between the previously-deployed commit and the current one) instead of re-posting the whole accumulated Unreleased section. Falls back to the full section when the previous deploy commit is unknown.
- Prefixes each post with **inline change-type labels** (text, e.g. `📦 Dependencies · 🐛 Fix`) derived from each entry's heading: ✨New / 🛠️Improvement / 🐛Fix / 📦Dependencies / 🔒Security / 🔧Internal. Plain text — no Discord forum tags, tag IDs, or bot token required.
- Dropped the hard-coded "ORO" product branding (this is now white-label fiduciary software). Notifications now read the firm name from a `COMPANY_NAME` repo variable — when set, the post is branded for that firm ("A new version of **<Firm>** is now live"); when unset, it falls back to neutral wording ("The platform just got an update").
- Added `CLAUDE.md` (LLM coding guide) and refreshed `README.md` / `docs/discord-notifications.md`.

### Changed — Upgrade to Next.js 16 + ESLint flat config
- Bumped `next` and `eslint-config-next` 15.5 → 16.2.9. Next 16 removed `next lint`, so migrated to the ESLint CLI: replaced `.eslintrc.json` with `eslint.config.mjs` (flat config spreading `eslint-config-next/core-web-vitals`) and changed the `lint` script to `eslint .`.
- Bumped `next-auth` 5.0.0-beta.25 → beta.31, the first beta whose `next` peer range includes 16. Also added `--legacy-peer-deps` to `Dockerfile.dev`'s `npm install` (matching the prod Dockerfile and CI) so the dev image build resolves cleanly.
- `eslint-config-next` 16 enables the new React Compiler ruleset (`react-hooks` v6). The rules that flag existing call sites — `static-components`, `set-state-in-effect`, `purity` — are set to `warn` so the framework upgrade doesn't bundle a large behavioural cleanup; resolving them is follow-up work.
- ESLint stays on 9.x: the latest `eslint-plugin-react` (7.37.5, pulled by `eslint-config-next`) caps its ESLint peer at `^9.7` and crashes on ESLint 10's removed `context.getFilename()` API. ESLint 10 (Dependabot #17) is therefore blocked upstream until `eslint-plugin-react` ships ESLint 10 support.

### Changed — Upgrade Prisma to 7 (driver adapters)
- Bumped `prisma` and `@prisma/client` 5.22 → 7.8.0. Prisma 7 no longer reads the connection URL from `schema.prisma` and connects through a driver adapter, so:
  - Removed `url` from the `datasource` block and added `prisma.config.ts`, which supplies the URL to CLI / schema-engine commands (`db push`, `validate`, `studio`) from `DATABASE_URL` (with a dependency-free `.env` loader for local dev, since Prisma 7 no longer auto-loads `.env`).
  - Added `@prisma/adapter-pg` + `pg` and a shared `src/lib/prisma-adapter.ts` helper; every `PrismaClient` (web `src/lib/db.ts`, the three workers, and the test harness) now constructs with the pg adapter. The test harness replaces the removed `datasources` constructor option with the adapter.
  - The `prisma-client-js` generator still emits to `node_modules/@prisma/client`, so the ~80 `@prisma/client` import sites are unchanged.
  - Dockerfile now copies `prisma.config.ts` into the runtime image so `prisma db push` / `migrate deploy` can resolve the connection URL at deploy time.

### Fixed — Worker Docker build broken under TypeScript 6
- `tsconfig.worker.json` still used `baseUrl` and `moduleResolution: node` (node10), which TS 6 flags as errors (TS5101 / TS5107). The TS 6 bump only updated `tsconfig.json`, so `npm run worker:build` in the Dockerfile failed — breaking the `Build Docker image` CI job and blocking all production deploys. Added `"ignoreDeprecations": "6.0"` to the worker config (the worker build depends on `baseUrl` for `tsc-alias`); behaviour is unchanged.

### Changed — Upgrade TypeScript to 6.0
- Bumped `typescript` 5.9 → 6.0.3. Removed the deprecated `baseUrl` from `tsconfig.json` (TS 6 deprecates it, TS 7 removes it); the `@/*` path mapping resolves fine without it since all source imports are either `@/*` or real packages. Added `src/types/assets.d.ts` declaring `*.css` to satisfy TS 6's stricter side-effect-import checking (TS2882) for `import "./globals.css"`.

### Changed — Bump dev tooling group + CI Node 20 → 26
- Bumped the dev-minor-patch group (`@playwright/test`, `@testcontainers/postgresql`, `@vitest/coverage-v8`, `tsx`).
- Bumped CI `node-version` from 20 to 26 across the unit, integration and e2e jobs. The new `@testcontainers/postgresql` pulls `undici@8`, which requires Node ≥ 22.19 (`worker_threads.markAsUncloneable`); on Node 20 every integration suite crashed at import with `webidl.util.markAsUncloneable is not a function`. CI now matches the production runtime image (`node:26-alpine`).

### Changed — CI: exempt Dependabot from the changelog gate
- The `Changelog updated` check now skips Dependabot PRs (`github.actor != 'dependabot[bot]'`). Dependency bumps only touch manifests/lockfiles and never edit `CHANGELOG.md`, so the gate was failing every Dependabot PR. Human PRs still require a changelog entry.

### Changed — Unify all admin pages onto the prototype design system
- Converted every remaining `/admin` page off the older "Quiet Authority" tokens (`font-display`, `text-ink`, `--admin-*`, bespoke `Th`/`Td` table helpers, `min-w-[1000px]`) onto the prototype component system (`.card`, `.tbl`/`.tbl-wrap`/`.tbl-toolbar`, `.chips`/`.chip`, `.badge*`, `.kpi-tile`, `.dl`, `.file-row`, `.scrim`/`.modal*`, `.field`/`.input`). The whole admin surface now shares one look.
  - Lists/detail: clients (list + full client detail: header, tabs, key-dates, compliance bar, conversation, folders, modals), submissions (queue + detail + actions + party workspace), users, analytics (shared KPI tiles), messages, content editor.
  - Settings: layout, chip-tab nav, and branding form.
- Fixed the clients table clipping off-screen (removed the forced `min-w-[1000px]`; `.tbl-wrap` now scrolls). Restored content padding on the standalone submission-detail page (wrapped in `.appmain`).
- Added the prototype `.file-row` styles to globals.css (the only class that was missing).

### Changed — Pricing page
- Refreshed `/pricing` styling to the prototype's card layout (responsive `price-grid`, available/unavailable feature markers, "Most popular" highlight) while keeping the **firm's own service pricing** (Essentials / Standard / Full service, setup-fee + monthly retainer).
- Note: the new prototype's pricing page sells the white-label *platform* to firms with a monthly/annual SaaS toggle. That model is intentionally **not** used in tenant builds — each deployment is white-labelled for one firm and must show that firm's service pricing to its clients, not the platform's subscription tiers. The platform toggle was therefore dropped from the app.

### Added — Compliance suite (new prototype)
- New **Compliance hub** (`/admin/compliance`): KPI tiles (active onboardings, KYC pending, AML flags, UBOs), a suite grid linking the eight tools, a "cases needing attention" table and a compliance-posture summary (applicants screened, raw vendor hits, true matches, structures mapped, overdue obligations). Wired to live prospects.
- Six new compliance tools, each built on deterministic intelligence derived from real prospects (`src/lib/services/compliance-intel.ts`) and gated by plan tier:
  - **KYC / ID verification** (`/admin/compliance/kyc`) — document + biometric liveness/face-match results per applicant (Scale).
  - **KYB verification** (`/admin/compliance/kyb`) — registry records for corporate applicants: legal status, type, directors, filings, with a link to the ownership map (Scale).
  - **AI screening** (`/admin/compliance/ai-screening`) — collapses raw sanctions/PEP/adverse-media hits into true matches, showing the noise-reduction (Scale).
  - **Ownership map** (`/admin/compliance/ownership`) — recursive UBO tree with effective-ownership math (multiplied down the tree) and ≥25% UBO flagging (Scale).
  - **Client risk** (`/admin/compliance/risk`) — 0–100 risk scoring across the portfolio with driver breakdown (Scale).
  - **AML reporting** (`/admin/compliance/reporting`) — SAR/STR, periodic-review and UBO-confirmation report templates plus a recent-reports log (Scale).
- New **Documents & e-sign** (`/admin/documents`, Professional): firm-wide document library with version history, expiry tracking, e-signature templates and a dropzone. New **Connect & API** (`/admin/integrations`, Scale): connected-services grid, webhooks table and branded API keys.
- Provider-side actions that require live third-party wiring (generate report, refresh from registry, connect/regenerate keys, send for signature, upload) are labelled **coming soon**; the UI mirrors the prototype exactly.
- Rebuilt the admin sidebar to the full prototype IA (Overview / Compliance / Relationships / Engagement / Firm / Configure), persona- and tier-aware.

### Added — AI Advisor (new prototype)
- `/advisor`: a conversational AI advisor (free, no sign-up) that matches a free-text need to a recommendation. Keyword intent tree (`src/lib/data/advisor.ts`) with clarify chips and branch routing; renders a recommendation card (service(s) + primary jurisdiction with corp/VAT/formation stats + "also strong" alternatives) and CTAs (Start application, See matching providers, Compare jurisdictions). Added "Advisor" (AI badge) to the public nav.
- Shared `Icon` component (`src/components/Icon.tsx`, full prototype icon set) and `services` data module for reuse across the new features.


### Added — Partner-network marketplace (new prototype)
- Marketplace of 20 vetted partners (banks/EMIs, corporate services, advisory, licensing) for visitors and clients: category tabs, search, jurisdiction/industry/speed filters, remote toggle, sort, grid/list views, provider detail modal, compare (up to 3) modal, and concierge. `/marketplace` (public) + `/app/marketplace` (client).
- "Get started" applies to a partner (persisted via new `Application` model + `POST /api/applications`); clients track them under **My applications** (`/app/applications`). Reuses the verified KYC profile messaging.
- Nav: "Partner network" in the public nav; "Network" group (Partner network + My applications) in the client sidebar.


### Added — Super-admin provisioning via GitHub secrets → .env
- The platform super-admin is now configured entirely through GitHub secrets and injected into the prod box at deploy time (no hand-editing the box):
  - `SUPER_ADMIN_EMAILS` and `SUPER_ADMIN_PASSWORD` are passed from secrets through `deploy.yml` (over SSH) and written into `/opt/oro/.env` by `deploy/deploy-oro.sh` (idempotent `upsert_env`).
  - New idempotent `src/worker/ensure-super-admin.ts` (compiled to `dist-worker`) runs every deploy and upserts each `SUPER_ADMIN_EMAILS` entry as a verified `staff` user (password from `SUPER_ADMIN_PASSWORD` on first create; existing accounts promoted to staff without password reset).
- Configured `ttofisandreas@gmail.com` as the production super admin.

### Added / Changed — Align admin to the platform prototype
- New **admin Dashboard** landing (`/admin`) with KPI tiles, a recent-submissions table and a recent-activity feed (was a redirect to the submissions queue).
- New **unified Messages inbox** (`/admin/messages`): a 2-pane thread list + conversation (reuses the client-detail `ConversationView`, replies via the existing messages API).
- **AML / KYC screening panel inline** on the submission detail (Scale-gated; shows a locked note below Scale), plus a **Regenerate** control on the AI brief.
- **Client-facing brief-completeness meter** in the onboarding header, computed live from the draft.
- Reorganised the admin sidebar (Overview / Relationships / Compliance / Firm) and **removed the Compliance *tasks* queue** UI section (`/admin/compliance/tasks`); the ReviewTask model, API route and worker jobs are unchanged.
- Note: the prototype's pricing monthly/annual toggle was intentionally not ported — the public pricing page reflects the firm's setup-fee + retainer model, where a billing-period toggle doesn't apply.

### Added — Two admin personas (platform admin vs staff admin)
- Split the admin surface into two personas, both on the `staff` DB role, distinguished by the `SUPER_ADMIN_EMAILS` env allowlist (set by the platform operator at deploy time):
  - **Platform admin** (super admin, the code owner) sees **only** the Settings area (`/admin/settings/*` — branding, plan, services, team, flags).
  - **Staff admin** (everyone else) sees **everything except** Settings.
- Enforced in `middleware.ts` by path: a super admin hitting any non-settings `/admin` route is redirected to `/admin/settings`; a staff admin hitting settings is redirected to `/admin`. The settings layout also guards with `requireSuperAdmin()`, and `PATCH /api/admin/settings/org` rejects plan-tier changes from non-super-admins (403). The admin sidebar shows each persona only its own nav.
- The plan tier is therefore operator-controlled and edited in **Settings → Branding & plan** (prototype tier-card UI). Helpers `isSuperAdmin()` / `currentIsSuperAdmin()` / `requireSuperAdmin()` in `src/lib/auth/guards.ts`; JWT now carries `email` for the middleware check.

### Changed — Repository renamed to `fiduciary-software`
- Renamed the GitHub repo `oro-corporation` → `fiduciary-software`. CI derives the GHCR image path from the repo name automatically; updated the one hardcoded image reference in `deploy/deploy-oro.sh` to `ghcr.io/andrewttofi/fiduciary-software:latest` so deploys keep matching the freshly-built image. Updated clone/wiki URLs in the README and getting-started docs. GitHub redirects keep old URLs working.

### Added — White-label platform features
- White-label branding: configurable brand name, wordmark letter, accent colour and theme preset (indigo/emerald/gold/burgundy/slate), applied app-wide via injected CSS variables (`src/lib/services/branding.ts`). New **Settings → Branding & plan** tab with live preview.
- Plan tiers (Starter/Professional/Scale) with feature gating: partner portal + compliance calendar require Professional; AML screening requires Scale. `tierAtLeast()` helper, `UpgradeGate` component, tier-aware admin nav.
- Public lead-magnet tools: **jurisdiction comparison** (`/tools/compare`, 18 jurisdictions, sortable, best-value highlight) and **tax calculator** (`/tools/calculator`, email-gated reveal → creates a CRM lead). Corporate-tax and VAT figures verified against PwC Worldwide Tax Summaries with per-row source links (reviewed June 2026).
- CRM: `Lead` model + `/admin/crm` unified pipeline (leads/applicants/clients); public `POST /api/leads` capture.
- AI-generated internal brief + auto-computed completeness score (low/med/high) on submissions, with a staff override and a Brief column in the queue (`src/lib/services/prospect-intel.ts`).
- Compliance calendar (`/admin/compliance/calendar`) and AML screening (`/admin/compliance/aml`), both tier-gated.
- Editable marketing content (CMS-lite): `SiteContent` model + **Settings → Content** editor (hero, steps, stats, testimonials, CTA, FAQ); landing page and FAQ read from it live.

### Added — Ops & notifications
- Discord deploy notifications: `notify-discord` workflow posts a plain-language "what changed" forum summary (from the changelog) after a successful deploy; editable templates in `scripts/notify-deploy/`.
- Dependabot (`.github/dependabot.yml`): weekly grouped updates for npm, GitHub Actions and Docker.

### Fixed — Admin UI
- Client document folders showed raw service keys (`company_formation`) instead of labels — the page now seeds/reads the service taxonomy via `getServices()` with a humanize fallback.
- Client **Services** tab rows were misaligned in the narrow content column — restructured into a card with an aligned name+actions header and equal Status/Partner/Notes columns.
- Disabled the Next.js dev indicator that overlapped the sidebar "Log out".

### Changed — "Quiet Authority" redesign (full)
- Re-skinned the design system from the warm "private-bank" serif aesthetic to the platform prototype: indigo brand (`#2E4A8B`) + champagne-gold accent (`#C9A86A`), cool light-gray surfaces, navy ink, **system sans** (dropped Fraunces serif), rounded 6–8px corners, navy-tinted shadows.
- `tailwind.config.ts` + `globals.css` retoken (names kept stable so utilities re-skin without edits); added prototype component classes (card/kpi/table/timeline/bubble/note/chip/avatar/sidebar/appbar/auth).
- **Marketing** rebuilt to prototype layout: home (hero/3-step/services/proof/testimonials/CTA), services, pricing, FAQ; new **Terms** + **Privacy** pages; public nav + dark footer.
- **Sign-in** rebuilt to a centered auth card; `Logo` → sans wordmark (auth + onboarding).
- **Client portal**: light sidebar + appbar shell; dashboard, prospect dashboard, and sub-pages aligned (KPI cards, brand timeline, message bubbles, badges).
- **Admin app**: light sidebar + appbar shell; submissions/clients/compliance + client detail headings to plain bold sans; conversation bubbles → brand.

### Fixed
- Client login redirected to `/app`, which had no index page → 404. Added `/app` → `/app/dashboard` redirect.

### Added — Self-hosted deploy pipeline
- `deploy/deploy-oro.sh` — idempotent ORO deploy (pulls prebuilt GHCR image, self-signed HTTPS on :443 + HTTP on :80, persistent `.env`, proxy re-resolve).
- `.github/workflows/deploy.yml` — `deploy-oro` workflow on a self-hosted runner (`oro-ci`); SSHes to the ORO host over the private network and runs the deploy. Triggers on CI success on `main` + manual dispatch.
- `docker-compose.prod.yml` — single-host hardening overlay (resource caps, log rotation, no-new-privileges, pids limits).
- `deploy/SERVER.md` — generic Ubuntu server runbook; `deploy/backup.sh` + systemd units for nightly db+docs+secrets backups; `make backup-all` / `restore-all`.

### Fixed — CI
- `e2e/messaging.spec.ts` used the **client** composer's selectors against the **staff** page — wrong textarea placeholder (`Type a message…` vs `Address the client. Be precise.`) and a button matcher (`/^send$/i`) that never matched the actual `Send →` button. Fixed both; this was the only red E2E test (pre-existing) and blocked the green CI gate that auto-deploy depends on.

### Added — Bucket-A polish (PR #4)
- Hit-review status pill per party on the compliance file dashboard: shows "N to review" in red when unreviewed hits exist.
- "Last screened / next due" per-party indicator with risk-band cadence math (high=30d, standard=90d, low=365d); turns red when overdue.
- Doc purpose dropdown on admin upload (replaces silent default); staff can pick passport / proof_of_address / source_of_funds / other before choosing a file.
- "No-delete" audit note on the client documents page.
- Edit DocumentRequest before fulfilment — modal on `/admin/clients/[id]/request-docs` pre-filled with description + dueAt; calls PATCH route.
- Risk-override history block on the compliance RiskPanel (collapsible `<details>`, last 10 overrides).

### Fixed — Bucket-A bug fixes
- `assign-partner` route now rejects non-partner target users with 400 (was accepting any UUID).
- `auto-rescreen` outer query widened from 365d to 30d so high/standard-band cases are no longer excluded from the per-tick sweep.
- `ActivityAction` union gains `doc_request.updated`.

### Added — Test hardening (PR #4)
- Vitest projects split into `unit` (fast, mocked Prisma) and `integration` (real Postgres via @testcontainers/postgresql).
- ~270 new tests across API routes (~30 routes, 4-6 tests each), worker jobs (auto-rescreen, periodic-review, backfill-compliance), service-layer (screening, client-portal migrated to real DB).
- 8 Playwright E2E specs (`auth`, `onboarding-submit`, `convert-to-client`, `messaging`, `doc-request`, `compliance-gate`).
- NODE_ENV-guarded `/api/test/reset?seed=1` route for E2E DB resets + seed; `ALLOW_TEST_RESET=1` env var allows enabling against dev stack.
- Test-only `/api/test/setup-client` route for fast compliance clearance in E2E.
- Rate-limiter bypass when `ALLOW_TEST_RESET=1` so E2E doesn't blow through the 5/10-min auth limit.
- CI gains `integration` (testcontainers) and `e2e` (docker stack + Playwright) jobs.
- Playwright HTML report uploaded as artifact on failure.

### Fixed
- `wrapTx` (test helper) now supports both callback and array forms of `prisma.$transaction(...)`.

### Concerns surfaced (not fixed in this PR)
- `src/worker/jobs/auto-rescreen.ts`: the outer `findMany` filter uses a 365-day floor that excludes high/standard-risk cases (cadence 30d/90d) whose latest run is younger than 365d but older than their band cadence. Per-case `cutoffForBand` check is correct but unreachable for these cases. Tracked for follow-up.
- `src/app/api/admin/submissions/[id]/assign-partner/route.ts`: accepts any user UUID as `partnerId` without verifying the target's role. Tracked for follow-up.

### Added — Client portal v1 (PR #3, branch `feature/client-portal`)
- Role-aware `/app/dashboard`: prospects keep the existing submission view; converted clients now see active services, upcoming key dates (next 30 d), open document requests, recent staff messages (7 d), recent activity, and a "book a follow-up" CTA when no booking is scheduled in the next 14 d.
- `/app/messages`: unified read (`Message.prospectId` OR `Message.clientId`) so messages staff sent from the admin side after conversion are finally visible to the client; composer posts to the new `/api/account/messages`; staff bubbles are now visually distinct from peer/system bubbles.
- `/app/documents`: rewritten per-folder layout matching the admin view. Open `DocumentRequest`s render with inline `Upload` buttons that atomically fulfil the request; clients can also upload arbitrary documents into any service folder via the `Upload a document` modal.
- `/app/application`: small notice for converted clients pointing them to Dashboard for current service status.
- `/app/settings`: new "Company" section for clients — editable `address`, `taxResidency`; read-only `companyName`, `registrationNumber`, `vatNumber`, `engagementLetterDate` with "contact your account manager" hint.
- New service layer `src/lib/services/client-portal.ts`: `getMessagesForUser`, `sendClientMessage`, `updateClientSelfProfile`, `uploadClientDocument` (ownership-checked).
- New API routes: `POST /api/account/messages`, `POST /api/account/documents`. Extended `POST /api/account/profile` to accept `address` + `taxResidency`.
- Activity action: `client.self_profile_updated`.

### Process
- Added `CHANGELOG.md` (this file) plus enforcement via `.github/workflows/ci.yml` and `.github/pull_request_template.md`.

---

## 2026-05-24 — Client detail page full functionality (PR #2)

### Added — `/admin/clients/[id]` rewrite
- `EditableClientHeader`: inline edit for `companyName`, `country`, `address`, `registrationNumber`, `vatNumber`, `taxResidency`, `engagementLetterDate`, plus `User.phone`.
- `ComplianceBar`: status + risk-rating pill + link to the (previously orphaned) `/admin/clients/[id]/compliance` page.
- Services Engaged: inline edit (status / partner / notes), `+ Add service` modal (pulls active services from the DB-backed taxonomy), Remove.
- Key Dates: edit / mark complete / delete, with `Hide completed` filter chip.
- Documents: per-folder sections under real `<section id="docs-X">` anchors. Staff upload, view inline (via `/api/documents/[id]`), set status (`received` / `under_review` / `approved` / `reupload_needed`), delete. Open `DocumentRequest`s render inline per folder with cancel.
- `ReassignModal` replaces the previous `alert()` placeholder; reassigns primary staff via PATCH.
- All four `QuickActions` are now real links (Send Message, Request Docs, Add Service, Add Key Date).

### Added — Messaging + document requests (Phase 2)
- `/admin/clients/[id]/messages` thread page + composer; `sendMessage` service writes the row and best-effort emails the client.
- `/admin/clients/[id]/request-docs` page + form; `createDocumentRequest` writes the row and emails the client. Cancel and (via the new fulfillment seam in `uploadDocument`) automatic fulfilment supported.

### Schema
- `Client`: `country`, `address`, `registrationNumber`, `vatNumber`, `taxResidency`, `engagementLetterDate`.
- `Document.serviceTypeKey`: optional service-folder bucketing key.
- New model `DocumentRequest` (state: `open` / `fulfilled` / `cancelled`).

### Fixed (from final review)
- `DocumentRow` iframe URL was `/app/documents/[id]` (a list page); corrected to `/api/documents/[id]`.
- `uploadDocument` now accepts `purpose: DocPurpose` so the KYC folder actually receives KYC documents from staff uploads.
- `PATCH /api/admin/clients/[id]`: pre-validation of client + primary-staff target to prevent partial multi-write state.
- `POST /api/admin/clients/[id]/document-requests`: returns 404 (not 500) when the client doesn't exist.

---

## 2026-05-24 — KYC / AML compliance subsystem (PR #1)

### Added
- `ComplianceFile` aggregate per Prospect / Client; per-party `KycCase`; `ScreeningRun` + `ScreeningHit`; `ReviewTask`.
- OpenSanctions integration (free public API, optional paid key) with retry + threshold filtering.
- Rules-based risk scoring (`computeRisk`): geo + PEP + industry + complexity + turnover factors; bands `low` (0–2) / `standard` (3–5) / `high` (6+); FATF blacklist forces `high`; confirmed sanctions hit forces `blocked`.
- Worker cron jobs: hourly auto re-screening (cadence by risk band) and daily periodic-review reminders. Backfill on worker boot creates ComplianceFile rows for pre-existing Prospects/Clients.
- Conversion gate: `convertProspectToClient` blocks when ComplianceFile is not `cleared`; ConvertModal shows per-candidate compliance pill.
- Admin UI: `/admin/clients/[id]/compliance`, `/admin/submissions/[ref]/compliance`, per-party workspace with IDV checklist + screening review, `/admin/compliance/tasks` cross-file queue.

### Schema
- 6 new models (ComplianceFile, Party, KycCase, ScreeningRun, ScreeningHit, ReviewTask) + Document/User extensions; `DocPurpose` enum (`passport` / `proof_of_address` / `sof` / `other`).

### Process
- Added Vitest (`vitest`, `vite-tsconfig-paths`) and the first 33 tests covering pure logic + services.
- CI workflow (`.github/workflows/ci.yml`): lint + typecheck + prisma validate.
- Switched to `legacy-peer-deps` for `npm ci` to reconcile the `next-auth@5-beta` vs `@auth/core` nodemailer peer-dep conflict.
