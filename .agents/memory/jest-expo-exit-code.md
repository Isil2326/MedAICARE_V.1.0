---
name: jest-expo exit code 1 despite all tests passing
description: Root cause + targeted fix for "Cannot log after tests are done" / ExpoModulesCoreJSLogger.
---
With the `jest-expo` preset, Jest can report **all tests passing but exit code 1**. Root cause: `expo-modules-core`'s `requireOptionalNativeModule('ExpoModulesCoreJSLogger')` fails in the Node test env and calls `console.warn(...)` **after teardown**, which Jest turns into "Cannot log after tests are done" → non-zero exit.

**Fix (targeted, safe):** in `jest.setup.ts`, wrap `console.warn` to drop ONLY messages containing the string `ExpoModulesCoreJSLogger`, delegating everything else to the original. This cannot mask test failures (it suppresses one noise string), and avoids a global `expo-secure-store` mock that would weaken token-leak tests.

**Why:** the late log is environment noise, not a test failure. **How to apply:** prefer this over `--forceExit` or parsing JSON output, both of which can hide real problems.
