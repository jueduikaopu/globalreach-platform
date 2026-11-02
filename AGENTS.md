# GlobalReach repository instructions

## Page delivery workflow

For every user-requested page or independently testable page update:

1. Implement only the requested scope and preserve unrelated user changes.
2. Run the relevant focused tests plus `npm run check` when repository structure changed.
3. Never commit `.env`, credentials, `.data`, logs, generated exports, dependencies, or temporary files.
4. After verification, commit the page-related changes and push them to `origin/main` unless the user explicitly requests local-only work, no push, a different branch, or a pull request.
5. Do not create empty commits. If pushing fails, preserve the local commit and report the exact blocker.
6. Keep the final handoff compact: page URL, verification result, commit SHA, and GitHub URL. Explicitly list material unfinished production integrations.

Use `npm run ship -- "<commit message>"` for the normal verified commit-and-push step. Inspect `git status --short` before running it so unrelated files are not included.

## Repository safeguards

- Public repository: do not add secrets, real customer data, licensed customs datasets, SMTP credentials, OAuth tokens, or local test databases.
- Mock integrations and mock datasets must be clearly labelled as mock.
- Keep tenant isolation and authorization checks on all non-public API routes.
- Do not weaken existing performance, security, accessibility, responsive-layout, SEO, or multilingual requirements.
