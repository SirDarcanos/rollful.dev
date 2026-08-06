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

Pushes to `main` deploy the Worker through GitHub Actions. It needs two repository secrets:

| Secret                  | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | a token created from the **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | the account owning `rollful.dev`, from `npx wrangler whoami`  |

To deploy by hand:

```bash
npm run deploy
```

`api.rollful.dev` is a Worker Custom Domain, so Cloudflare creates the DNS record and issues
the certificate on the first deploy. There is no DNS record to add by hand, and none to keep
in step afterwards. The `rollful.dev` zone must already exist in the account.

## Changes

Add an entry to [CHANGELOG.md](CHANGELOG.md) under `Unreleased` for anything that changes
the API's behaviour, its limits, or its response shapes.
