# Contributing

Thanks for your interest! This is a small, dependency-light toolkit — contributions that keep it that way are very welcome.

## Dev setup

```bash
npm install
# only needed if you touch the runtime tools (semantic diff / visual matrix):
npx playwright install chromium
```

The static tools (`gate.mjs`, `scan.mjs`) need **only** `@vue/compiler-sfc` — no browser.

## Run the self-tests

These are what CI runs; please make sure they pass before opening a PR.

```bash
node gate.mjs __selftest__   # expects: 契约自检 ✓ … then 2 errors + 2 warnings
node scan.mjs __selftest__   # expects: d-button → ui-button (exact) + el-card (truly missing)
```

If you change the example contracts or the `__selftest__/bad.vue` fixture, update the expected counts in `.github/workflows/ci.yml` accordingly.

## What lives where

- **Engines (library-agnostic, rarely need changes):** `gate.mjs`, `scan.mjs`, `capture-*.mjs`, `diff-*.mjs`, `explore.mjs`, `target-catalog.mjs`, `design-tokens.mjs`.
- **Library-specific data (this is what users edit):** `migrate.config.mjs`, `contracts.mjs`, `target-components.mjs`, `design-tokens.generated.json`.

The files committed here use neutral **examples** (target prefix `ui-`, Element Plus `el-` as a source). Please keep examples generic — do **not** commit any specific/private component library's data, internal paths, or credentials.

## Adding a migration contract

See [`docs/contract-gate.md`](docs/contract-gate.md). Rule of thumb: **only encode constraints you have verified** from the target library's source/types. When in doubt, omit `requiredProps` — prefer a false negative over a wrong rule that misleads a fix.

## Code style

- ESM (`type: module`), Node 18+.
- Keep it minimal: avoid adding runtime dependencies unless clearly justified.
- Comments should explain **intent / trade-offs**, not restate the code.

## Commits & PRs

- One focused change per PR; keep the diff small and reviewable.
- Make sure `node gate.mjs __selftest__` and `node scan.mjs __selftest__` pass.
- Describe **why** in the PR body, not just what.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
