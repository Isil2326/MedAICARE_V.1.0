---
name: Replit preview ports (MediAI Care)
description: Which workflow/port the main Replit preview shows, and why mobile UI changes can look "invisible".
---
The main Replit preview (`outputType = webview`) is bound to the **"Start application"** workflow = the **web app** on **port 5000** (externalPort 80). The **mobile** Expo Web app runs on **port 5173** with `outputType = console`, so it does NOT appear in the main preview.

**Consequence:** edits to `mobile/` are real but invisible in the default preview — the user is looking at the web app. To view mobile, open `https://<REPLIT_DEV_DOMAIN>:5173`.

**How to apply:** when a user says "I don't see my mobile changes", first check `.replit` workflow `metadata.outputType` and which port the main preview is bound to before assuming a build/cache problem.
