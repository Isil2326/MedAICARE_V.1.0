---
name: Web app ships a git-tracked single-file dist
description: Why sanitizing src/ is not enough — the deployed artifact is a committed vite-singlefile dist/index.html.
---
The web portal (`MedAICare_V.3_10Patients`) builds with the **vite singlefile** plugin: everything (JS + CSS) is inlined into ONE `dist/index.html`, and `dist/` is **git-tracked** and is the **static-deploy source**.

**Trap:** editing `src/` does NOT change what users see in production. A stale committed `dist/index.html` kept shipping old copy (false clinical claims) after the source was fixed. You MUST `npm run build` and verify `dist/index.html` after any user-facing copy/content change.

**Guard in place:** `src/test/no-clinical-claims.test.ts` scans both `src/**` and `dist/index.html` (skipIf no build) for forbidden claim patterns, so a stale dist fails CI.

**Why:** content-policy fixes (non-certified posture, no clinical claims) are only real once the deployed artifact reflects them. **How to apply:** after any copy edit, rebuild and re-scan dist; never assume source == deployed.
