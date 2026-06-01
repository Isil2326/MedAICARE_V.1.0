---
name: Jest mock hoisting in the Expo mobile app
description: Why mock factories must create jest.fn() inside themselves, and the jest-expo winter-fetch warning
---

# Jest mocking in `mobile/` (jest-expo preset)

## Rule: create the `jest.fn()` INSIDE the `jest.mock()` factory, then grab the ref via the import
`babel-plugin-jest-hoist` lifts every `jest.mock(...)` call to the very top of the
file — above any `const mock... = jest.fn()` you declared. So a factory that closes
over an outer `const` reads it while it is still `undefined` (TDZ), giving runtime
errors like `(0, _client.apiRequest) is not a function` or a mocked native module
whose methods are `undefined`.

**Correct pattern:**
```ts
jest.mock('@/services/api/client', () => ({ apiRequest: jest.fn() }));
import { apiRequest } from '@/services/api/client';
const mockApiRequest = apiRequest as jest.Mock; // grab ref AFTER import
```
For stateful native mocks (e.g. expo-secure-store) build the backing `Map` inside
the factory too.

**Why:** the outer-const pattern can *appear* to pass for suites that never call the
mocked function (it just checks "not called"), so the bug hides until a suite
actually invokes it. Don't trust a green suite that uses the fragile pattern.

## jest-expo winter fetch warning is harmless noise
The preset logs `An error occurred while requiring the 'ExpoModulesCoreJSLogger'
module: Cannot read properties of undefined (reading 'get')` / "Cannot log after
tests are done". It comes from `expo/src/winter/fetch` setup, NOT from your tests,
and does not fail the run. Tests that override `global.fetch` still work.

## tsc + jest globals
Expo's `tsconfig.base` uses bundler resolution and does NOT auto-include
`@types/jest`. Add `"types": ["jest", "node"]` to `mobile/tsconfig.json` so
`npx tsc --noEmit` sees `jest`/`expect`/`test` in the test files (rc=0).
A `jest.fn(async () => ...)` infers an empty call-args tuple `[]`; cast
`fetchMock.mock.calls[0] as any[]` before indexing `[1]`.

**How to apply:** any new test under `mobile/src/__tests__/`.
