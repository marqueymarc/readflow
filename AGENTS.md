# Development Rules

## Version History Entries
- Every new `VERSION_HISTORY` entry in `worker.js` must include:
  - `version`
  - `completedAt` in `YYYY-MM-DD` format
  - `note`
- Do not add a version entry without a completion timestamp.
- Increment `APP_VERSION` and package version for every deploy/release.
- Increment version for every release (patch by default unless explicitly requested otherwise).
- Every release must add a timestamped fix note to `VERSION_HISTORY`, and that history must be accessible via the version chip entry point.

## Local Server Accessibility (Do Not Repeat)
- When running a local web server for browser tests, start it in a persistent TTY session and keep that session alive while testing.
- Do not rely on one-off/backgrounded commands for server lifetime in this environment; they may exit and cause `ERR_CONNECTION_REFUSED`.
- Verify reachability before opening a browser:
  - `curl -I http://127.0.0.1:5173`
  - Expect a `2xx` response.
- Prefer `http://127.0.0.1:<port>` over hostname variants for local browser automation.
- If connection is refused:
  - confirm the listener is running,
  - restart the server in a persistent session,
  - re-run the `curl -I` check before testing.
