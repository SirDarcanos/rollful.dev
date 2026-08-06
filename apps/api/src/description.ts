// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * The introduction shown at the top of the API reference. It lives in the OpenAPI document
 * so anything rendering that document gets it, not only rollful.dev.
 */
export const API_DESCRIPTION = `
A hosted dice-rolling API powered by [OpenDice](https://www.npmjs.com/package/opendice).

Rollful parses a dice formula, rolls each die through a CSPRNG, and returns every die it
rolled rather than just the answer. It is not tied to any game system: it knows what
\`4d6kh3\` means, and nothing about what you use it for.

## In JavaScript

If you are already in JavaScript or TypeScript, you may not need this API at all. The
package rolls locally, with no network call:

\`\`\`bash
npm install opendice
\`\`\`

\`\`\`js
import { roll } from 'opendice'

const result = roll('4d6kh3')
console.log(result.total, result.dice[0].results)
\`\`\`

Reach for the API when rolling should not happen on the client: a shared result several
people must agree on, a server-authoritative roll, or a language that has no OpenDice
build.

\`\`\`js
const response = await fetch('https://api.rollful.dev/v1/roll?formula=4d6kh3')
const result = await response.json()

console.log(result.total)             // 14
console.log(result.dice[0].results)   // [5, 4, 5, 3] — every die, including dropped ones
console.log(result.dice[0].keptFlags) // [true, true, true, false] — which ones counted
\`\`\`

## In any other language

The API is plain JSON over HTTP with no authentication, so every language works. Pick one
from the client libraries panel beside each endpoint for a ready-made snippet.

\`\`\`python
import requests

result = requests.post(
    'https://api.rollful.dev/v1/roll',
    json={'formula': '1d20+7', 'advantage': 'advantage'},
).json()

print(result['total'], result['advantageState'])
\`\`\`

## Showing the working

Every response reports each die group separately. \`results\` holds every die rolled,
\`kept\` holds the ones that counted, and \`keptFlags\` lines up with \`results\` so an
interface can dim a dropped die rather than hide it. \`naturalHigh\` and \`naturalLow\` are
set only when a group kept exactly one die, because a top face among several is not a
critical on its own.

## Limits

OpenDice caps a roll at 1000 dice across all terms, 100 explosions per die, and a total
that stays an exact whole number. On top of that a request may carry a formula of 200
characters, 20 bonuses, and 20 rolls per batch, with the 1000-dice cap counted across the
whole request. Requests are limited to 60 every 60 seconds per address, applied per
Cloudflare location rather than globally.
`.trim()
