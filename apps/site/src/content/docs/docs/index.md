---
title: Getting started
description: Roll dice with the OpenDice package or the Rollful API, and read what comes back.
sidebar:
  order: 1
---

Rollful parses a dice formula, rolls each die through a CSPRNG, and returns every die it
rolled rather than just the answer. It is not tied to any game system: it knows what
`4d6kh3` means, and nothing about what you use it for.

There are two ways in, and which one you want depends on where the roll should happen.

## In JavaScript, use the package

The dice logic is an npm package. It rolls locally, with no network call, no rate limit and
no dependency on this service staying up.

```bash
npm install opendice
```

```js
import { roll } from 'opendice'

const result = roll('4d6kh3')

result.total // 14
result.dice[0].results // [5, 4, 5, 3]
result.dice[0].kept // [5, 5, 4]
```

If you are already in JavaScript or TypeScript, this is usually the right answer. The
package ships its own types, has no dependencies, and runs in browsers, Node and edge
runtimes alike.

## Anywhere else, call the API

Reach for the API when the roll should not happen on the client: a result several people
must agree on, a server-authoritative roll, or a language with no OpenDice build.

```bash
curl 'https://api.rollful.dev/v1/roll?formula=4d6kh3'
```

```json
{
  "formula": "4d6kh3",
  "dice": [
    {
      "sides": 6,
      "results": [5, 4, 5, 3],
      "kept": [5, 5, 4],
      "keptFlags": [true, true, true, false],
      "total": 14
    }
  ],
  "total": 14
}
```

No key, no signup, no account. The API is plain JSON over HTTP, so every language works.

For anything beyond a formula — bonuses, tags, or several rolls at once — use `POST`:

```bash
curl -X POST https://api.rollful.dev/v1/roll \
  -H 'content-type: application/json' \
  -d '{"formula":"1d20+7","advantage":"advantage"}'
```

## Where to go next

- [The formula grammar](/docs/grammar/) — everything a formula can say.
- [Reading a result](/docs/api/results/) — what each field means, and why dropped dice are
  reported at all.
- [The API reference](/reference/) — every endpoint, with a request you can send from the
  page.
