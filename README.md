# Rollful

A hosted dice-rolling API powered by [OpenDice](https://www.npmjs.com/package/opendice).

Rollful rolls dice over HTTP. It parses a formula, rolls each die through a CSPRNG, and
returns every die it rolled rather than just the answer. It is not tied to any game system:
it knows what `4d6kh3` means, and nothing about what you use it for.

- **API** — `https://api.rollful.dev`
- **OpenAPI** — `https://api.rollful.dev/openapi.json`
- **Site and documentation** — `https://rollful.dev`

## Quick start

```bash
curl 'https://api.rollful.dev/v1/roll?formula=4d6kh3'
```

```json
{
  "formula": "4d6kh3",
  "dice": [
    {
      "sides": 6,
      "sign": 1,
      "results": [5, 4, 5, 3],
      "kept": [5, 5, 4],
      "keptFlags": [true, true, true, false],
      "multiplier": 1,
      "total": 14,
      "naturalHigh": false,
      "naturalLow": false
    }
  ],
  "modifier": 0,
  "modifiers": [],
  "total": 14,
  "advantageState": "normal"
}
```

`results` holds every die rolled and `keptFlags` says which ones counted, so an interface can
show the dropped die rather than hide it.

For anything beyond a formula, use POST:

```bash
curl -X POST https://api.rollful.dev/v1/roll \
  -H 'content-type: application/json' \
  -d '{"formula":"1d20+7","advantage":"advantage"}'
```

## Endpoints

| Method | Path                       | Purpose                         |
| ------ | -------------------------- | ------------------------------- |
| `GET`  | `/v1/roll?formula=2d6%2B3` | one roll, from a query string   |
| `POST` | `/v1/roll`                 | one roll, with bonuses and tags |
| `POST` | `/v1/roll/batch`           | several rolls in one request    |
| `GET`  | `/v1/health`               | liveness check                  |
| `GET`  | `/openapi.json`            | the OpenAPI 3.1 document        |

## Formula grammar

| Formula              | Meaning                                                 |
| -------------------- | ------------------------------------------------------- |
| `2d6`                | roll two six-sided dice                                 |
| `1d20+7`, `10-1d4`   | flat modifiers                                          |
| `1d20adv`, `1d20dis` | advantage and disadvantage                              |
| `4d6kh3`, `4d6kl3`   | keep the highest or lowest three                        |
| `1d6!`               | exploding: a top face rolls again and adds              |
| `1d6x10`             | multiply this group's total by ten                      |
| `1d8+1d4+3`          | several terms                                           |
| `2d6 fire`           | a trailing tag, when the request lists `fire` in `tags` |

## Limits

OpenDice enforces the limits that keep a roll finite: at most 1000 dice across all terms, at
most 100 explosions per die, and a total that stays an exact whole number. The API adds:

| Limit            | Value                                      |
| ---------------- | ------------------------------------------ |
| Request body     | 8 KB                                       |
| Formula length   | 200 characters                             |
| Bonuses per roll | 20                                         |
| Rolls per batch  | 20                                         |
| Dice per request | 1000, counted across every roll in a batch |
| Rate limit       | 60 requests every 60 seconds, per address  |

The rate limit is applied per Cloudflare location rather than globally, so it is a guard
against abuse rather than a quota you can budget against.

## Errors

Every error returns the same shape with an HTTP status to match.

```json
{
  "error": {
    "code": "invalid_formula",
    "message": "A roll may use at most 1000 dice, but this one asks for 999999"
  }
}
```

Codes: `invalid_request`, `invalid_formula`, `payload_too_large`, `too_many_dice`,
`rate_limited`, `not_found`, `internal_error`.

## Repository

| Path              | Contents                                        |
| ----------------- | ----------------------------------------------- |
| `apps/api`        | the Cloudflare Worker serving `api.rollful.dev` |
| `packages/schema` | Zod schemas shared by the API and the site      |

See [CONTRIBUTING.md](CONTRIBUTING.md) to run it locally, and [AGENTS.md](AGENTS.md) for how
the pieces fit together.

## Licence

MIT. See [LICENSE](LICENSE).
