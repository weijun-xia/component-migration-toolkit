# component-migration-toolkit

[![CI](https://github.com/weijun-xia/component-migration-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/weijun-xia/component-migration-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**English** | [简体中文](README.zh-CN.md)

Migrate a Vue app from one component library to another (e.g. **Angular + DevUI / Element Plus → Vue 3 + your UI library**) — safely.

## Background

This toolkit grew out of a real **cross-framework rewrite** — porting a legacy **Angular + DevUI** app to **Vue 3** on a different component library. "Find-and-replace the tags" plus AI / codemod mapping suggestions kept producing subtle breakages that only surfaced in production. These tools are the guardrails we wish we'd had, distilled from the bugs that actually bit us.

## The problems it solves

Component-library migrations fail in two sneaky ways that plain find-replace and name-based mapping tools miss:

1. **Right name, wrong usage** — the tag maps fine, but a required prop / data contract doesn't, and nobody catches it before the code changes. Two classics:
   - a **tree renders blank** because the new library reads `label` / `children` through a different prop (`:props`) than the old one;
   - a **category-search gets swapped for an advanced-search**, whose required prop differs, so the UI renders garbled.
   These have a *static signature* → the **contract gate** stops them at edit time, before you even run the app.
2. **Right component ≠ same behavior** — even with every tag mapped correctly, the new build can still regress: a button that no longer responds, a dropped `/api` call, a missing feature, a data-specific crash. These have *no static signature* → only diffing the running new build against the old one (as the oracle) catches them → the **semantic diff**.

Why not just trust a mapping tool or an AI suggestion? Name-based mapping **doesn't understand semantic equivalence, can't see your runtime data, and never verifies its own output** — it will confidently point you at a component that doesn't exist, or the wrong equivalent. This toolkit swaps *"trust the mapping"* for *"verify with deterministic checks + the old build as ground truth."*

## What it gives you

Two complementary safety nets:

| Layer | Tool | Files | What it does | Cost |
|---|---|---|---|---|
| Static | **Contract gate** | `gate.mjs` + `contracts.mjs` | Parse `.vue` ASTs and flag **wrong / missing / truly-absent** mappings (e.g. a tree missing `:props`, an advanced-search missing `:fields`, leftover source-library tags) | Seconds, no browser |
| Runtime | **Semantic diff** | `capture-semantic.mjs` + `diff-semantic.mjs` + `journey.mjs` | Drive both builds, compare the **a11y tree + network + interactions + console**, using the old build as an oracle to catch behavioral regressions across frameworks | Needs a browser |

Two more optional tools:

- **Pre-migration inventory** — `scan.mjs` + `target-catalog.mjs`: enumerate source-library usage and classify each into *exact map / semantic candidate / truly missing / third-party*.
- **Visual state matrix** — `capture-matrix.mjs` + `diff-matrix.mjs` + `design-tokens.mjs`: walk *route × element × interaction-state* and classify visual changes into *regression / review / expected (matches design tokens)*.

> The engines are **library-agnostic**. Everything specific to *your* target library lives in a few data files you generate/edit: `migrate.config.mjs`, `contracts.mjs`, `target-components.mjs`, `design-tokens.generated.json`. The versions committed here are **neutral examples** using the `ui-` prefix and Element Plus (`el-`) as a source.

---

## Architecture

The static layer is a cheap **floodlight** (scan everything, flag suspects); the runtime layer is **precise strikes** (drive real pages, verify behavior). Regressions found at runtime get encoded back into contracts so the static gate catches them next time.

```mermaid
flowchart TB
    subgraph cfg["Library-specific data (you provide / generate)"]
        CFG["migrate.config.mjs<br/>target prefix, source libs"]
        CON["contracts.mjs<br/>source &rarr; target rules"]
        TC["target-components.mjs<br/>legal target tags"]
        DT["design-tokens.generated.json<br/>design tokens"]
    end

    SRC["Your .vue source"]
    OLD["Old build (oracle)"]
    NEW["New build"]

    subgraph static["1) Static layer &mdash; seconds, no browser"]
        SCAN["scan.mjs<br/>pre-migration inventory"]
        GATE["gate.mjs<br/>contract gate"]
    end

    subgraph runtime["2) Runtime layer &mdash; needs a browser"]
        SEM["capture-semantic + diff-semantic<br/>semantic diff"]
        MAT["capture-matrix + diff-matrix<br/>visual state matrix"]
    end

    SRC --> SCAN
    SRC --> GATE
    CFG --> SCAN
    CFG --> GATE
    TC --> GATE
    CON --> GATE
    SCAN --> RS["scan-report.md"]
    GATE --> RG["report-gate.md"]

    OLD --> SEM
    NEW --> SEM
    OLD --> MAT
    NEW --> MAT
    DT --> MAT
    SEM --> RSE["report-semantic.md"]
    MAT --> RM["report-matrix.md"]

    SEM -.->|new regressions feed back| CON
```

**Data flow in one line:** the `.vue` files a report flags → map to a route → run the runtime diff on that page; new runtime findings → add a contract → the static gate catches them for free next time.

---

## Install

```bash
npm i                                # @vue/compiler-sfc + playwright
npx playwright install chromium      # only needed for the runtime tools
```

The static gate/scan need **only** `@vue/compiler-sfc` (no browser).

## Quick start (self-test)

```bash
node gate.mjs __selftest__
```

Expected: `契约自检 ✓ …` then **2 errors + 2 warnings** against `__selftest__/bad.vue`
(missing `:fields`, a truly-absent `el-card`, a tree missing `:props`, a leftover `d-button`).

## Adapt it to your library

1. **Set your target prefix** in `migrate.config.mjs` (e.g. `targetPrefix: 'y'` if your components render as `<y-button>`), and list your source-library prefixes.
2. **Generate the real component list** so the gate can self-check contract targets:
   ```bash
   node extract-components.mjs "node_modules/@scope/your-ui"   # → overwrites target-components.mjs
   ```
3. **Write contracts** in `contracts.mjs` — one entry per `source → target` with any required props. Only encode constraints you have verified from the target library's source/types.

## Full workflow

```bash
# 1) Static gate — scan everything, cheap
node gate.mjs "/path/to/your/src"          # → report-gate.md

# 2) Semantic diff — targeted, old build as oracle
node explore.mjs http://old/login          # print a11y tree to copy into journey.mjs
node capture-semantic.mjs http://old/page old
node capture-semantic.mjs http://new/page new
node diff-semantic.mjs old.json new.json   # → report-semantic.md

# 3) Fix, then re-run both until clean.
```

New regressions the semantic diff catches but the gate missed → encode them back into `contracts.mjs`, so next time the static gate catches them for free.

See [`docs/contract-gate.md`](docs/contract-gate.md) and [`docs/semantic-diff.md`](docs/semantic-diff.md) for details.

## Repo layout

```
migrate.config.mjs          # central config: target prefix, source libs, third-party prefixes
contracts.mjs               # source → target migration contracts (EDIT THIS)
gate.mjs                    # static contract gate
scan.mjs / target-catalog.mjs   # pre-migration inventory + semantic matcher
extract-components.mjs      # generate target-components.mjs from your library
target-components.mjs       # legal target tags (EXAMPLE — regenerate)
capture-semantic.mjs / diff-semantic.mjs / explore.mjs / journey*.mjs   # runtime semantic diff
capture-matrix.mjs / diff-matrix.mjs / matrix.config.mjs                # visual state matrix
extract-tokens.mjs / design-tokens.mjs / design-tokens.generated.json   # design-token classifier
__selftest__/               # fixture for `gate.mjs __selftest__`
examples/                   # sample reports + a self-contained semantic-diff simulation
docs/                       # per-tool docs
```

## Browser

Runtime tools default to Playwright's bundled Chromium. To use a system browser instead, set `PW_CHANNEL=chrome` (or `msedge`).

## Notes / gotchas

- Prefer `node gate.mjs "path"` over `npm run gate -- path` (some shells drop the `--` args and scan the current directory).
- Semantic-diff network checks need `http(s)` (a `file://` page can't observe `/api` calls).
- `extract-tokens.mjs` reads a target-library CSS from `vendor/target-ui.css` (bring your own; `vendor/` is git-ignored).

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Please keep the committed data files generic (no private component-library data).

## License

[MIT](LICENSE)
