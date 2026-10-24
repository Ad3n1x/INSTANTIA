# INSTANTIA universal request engine

INSTANTIA should accept broad natural-language requests and attempt a safe path for each one. Universal support is a product goal, not a guarantee every request will succeed.

## Lifecycle
1. Validate the request.
2. Route to a verified capability when one matches.
3. Otherwise create a structured plan: category, steps, required inputs, risks, and verification checks.
4. If configured, use an OpenAI-compatible chat-completions provider via server-side environment variables.
5. Generate artifacts only in isolated, short-lived cloud workers. Never execute arbitrary generated code inside the API process.
6. Test outputs, then ask the user to keep or dispose.
7. Persist kept tools only after authentication, database-backed ownership, quotas, and deletion controls exist.

## Provider configuration
Set `INSTANTIA_MODEL_API_URL`, `INSTANTIA_MODEL_API_KEY`, and `INSTANTIA_MODEL_NAME` as Render environment variables. Never expose the key to the browser or commit it to Git.

## Current implementation status
- Implemented: request routing, generic plan-only fallback, optional provider-backed planning, image-to-PDF.
- Not implemented: code generation/execution, sandbox workers, CSV analysis, persistent keep/dispose, user accounts, MySQL persistence, queues, billing, or end-to-end generated-tool verification.
- Until sandbox execution is implemented and tested, custom requests produce plans rather than pretending tools have been completed.
