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
