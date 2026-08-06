# Working in this repository

Rollful is a hosted dice-rolling API built on the `opendice` npm package. This file is the
single source of agent guidance. Setup, style and tests are in
[CONTRIBUTING.md](CONTRIBUTING.md).

## What this repository is, and is not

Rollful hosts OpenDice. It does not reimplement it. Parsing, rolling, keep rules,
explosions and the randomness all live in the package, and the API is a thin layer that
adds what a public endpoint needs: validation, limits, CORS, rate limiting and an OpenAPI
document.

If you find yourself writing dice logic here, it belongs in `opendice` instead.

Rollful is not tied to any game system. It knows what `4d6kh3` means and nothing about what
anyone uses it for. Do not add rules, character sheets, system presets or named rolls.

## The line that must not be crossed

`RollContext.rand` lets a caller supply their own random source. It is not exposed through
the API and must never be. A roll result records what the dice showed, never where the
numbers came from, so a rigged source produces a result indistinguishable from a fair one.
Exposing it would let anyone choose their own results while the response still looked
honest.

## Layout

| Path                   | Contents                                         |
| ---------------------- | ------------------------------------------------ |
| `apps/api`             | the Worker: routes, guards, error mapping        |
| `apps/api/src/dice.ts` | the only place that calls OpenDice               |
| `packages/schema`      | Zod schemas and the limits, shared with the site |

`packages/schema` is consumed as TypeScript source, not built. Both the Worker bundler and
Astro compile it, so it has no build step.

## Where limits live

Every limit the API adds is in `packages/schema/src/limits.ts`, and nowhere else. The site
reads the same file to document them, so a number changed there changes the guard, the
OpenAPI document and the docs together. Do not hardcode a limit in a route or a test.

The limits OpenDice enforces itself are not repeated here. It already caps formula length,
dice per roll, explosions per die, bonuses and the total's precision, and its parse errors
are already safe to return: `excerpt()` replaces any character a formula cannot contain
before quoting input back.

## The CPU budget

The Workers free plan allows 10ms of CPU per request. The worst single roll OpenDice will
accept, `1000d2!`, costs about 1.7ms, so single rolls are safe by a wide margin.

Batches are not, which is why `assertWithinDiceBudget` exists. Twenty rolls of `1000d2!`
would cost about 34ms. Parsing costs roughly 1% of rolling, so the handler parses every
formula first, sums the dice, and refuses the request before rolling anything. Any new
endpoint that rolls more than once must go through the same function.

## Node APIs

OpenDice uses none, and `wrangler.jsonc` deliberately has no `compatibility_flags` and no
`nodejs_compat`. Randomness is `crypto.getRandomValues`, which workerd provides. The test
"the Worker runs OpenDice without Node APIs" exists to catch a regression at deploy rather
than in production. Do not add `nodejs_compat` to make a dependency work — pick a
dependency that does not need it.

## Traps

- `roll()` returns objects made with `Object.create(null)`. They serialise fine, but they
  have no `hasOwnProperty` and no prototype. `dice.ts` copies the fields it needs rather
  than passing the object straight through.
- `parseFormula()` throws on a string bonus that contains no dice, such as `'3'`. Numeric
  bonuses must be sent as numbers. This matches what OpenDice does internally.
- The rate limit binding is per Cloudflare location, and `period` accepts only 10 or 60.
  Do not document it as a global quota.
- A trailing word in a formula is a parse error unless the request lists it in `tags`. That
  is deliberate: an unrecognised word is far more often a typo than a tag.

## Style

Prose is neutral and direct, readable at high school level. It documents the product; it
does not narrate.

Comments are kept to a minimum. Code should be self-explanatory, and a comment is only worth
adding where the code cannot express the point. If the code could express it, change the
code instead.

## Before you finish

```bash
npm run typecheck && npm test && npm run format:check
```
