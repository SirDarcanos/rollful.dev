# Contributing

## Setup

Node 22 or later.

```bash
npm install
```

The repository uses npm workspaces. Install once at the root; do not install inside a
workspace.

Two packages have install scripts that fetch platform binaries, `esbuild` and `workerd`.
They are approved explicitly in the root `package.json` under `allowScripts`, so a new
dependency that wants to run install scripts has to be approved deliberately.

## Running the API

```bash
npm run dev
```

This starts `wrangler dev` on `http://localhost:8787` with the same bindings as production,
including the rate limiter.

```bash
curl 'http://localhost:8787/v1/roll?formula=4d6kh3'
curl 'http://localhost:8787/openapi.json'
```

## Running the site

```bash
npm run dev --workspace @rollful/site
```

Astro serves on `http://localhost:4321`, and the reference is at `/reference`.

By default it reads the production API, which means the reference documents whatever is
deployed rather than what you are working on. To point it at a local Worker, copy
`apps/site/.env.example` to `apps/site/.env` and run both:

```bash
npm run dev --workspace @rollful/api
npm run dev --workspace @rollful/site
```

`.env` is not committed. The variable sets both the document the reference loads and the
server its "try it" requests go to.

## Checks

```bash
npm run typecheck
npm test
npm run format:check
```

`npm run typecheck` regenerates `apps/api/worker-configuration.d.ts` with `wrangler types`
before compiling, so binding types always match `wrangler.jsonc`. That file is generated and
is not committed.

## Tests

Tests run inside workerd through `@cloudflare/vitest-pool-workers`, not in Node. This is
deliberate: the API's whole premise is that OpenDice needs no Node compatibility layer, and
a test running in Node would not prove it.

```bash
npm test --workspace @rollful/api
cd apps/api && npx vitest    # watch mode
```

Tests drive the Worker over HTTP through `SELF`, so middleware, validation, error mapping
and CORS are all covered rather than bypassed. Each request sends its own
`cf-connecting-ip`, because the rate limiter is real in local tests too and a shared address
would make one test spend another's budget.

Read limits from `@rollful/schema` in tests rather than repeating the numbers.

## Style

Prettier settings are in `.prettierrc.json`: no semicolons, single quotes, 100 columns.

```bash
npm run format
```

Prose is neutral and direct, readable at high school level. Comments are kept to a minimum;
code should explain itself, and a comment is only worth adding where the code cannot express
the point.

Every source file starts with the SPDX header:

```ts
// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone
```

## Deploying

Pushes to `main` deploy through GitHub Actions: the API when `apps/api` or
`packages/schema` change, the site when `apps/site` or `packages/schema` change. Both need
the same two repository secrets:

| Secret                  | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | a token created from the **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | the account owning `rollful.dev`, from `npx wrangler whoami`  |

To deploy by hand:

```bash
npm run deploy                            # the API
npm run deploy --workspace @rollful/site  # the site
```

Both `rollful.dev` and `api.rollful.dev` are Worker Custom Domains. The site is a Worker
with an assets binding and no `main`, so it serves static files and runs no code of its own.

Cloudflare creates the DNS record and issues the certificate on the first deploy, so there
is no DNS record to add by hand and none to keep in step afterwards. Do not edit those
records in the dashboard. The `rollful.dev` zone must already exist in the account.

## Changes

Add an entry to [CHANGELOG.md](CHANGELOG.md) under `Unreleased` for anything that changes
the API's behaviour, its limits, or its response shapes.
