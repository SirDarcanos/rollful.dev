// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * The introduction to the endpoint reference. It lives in the OpenAPI document so anything
 * rendering that document gets it, not only rollful.dev — which is why the link out is
 * absolute.
 *
 * Keep it to what the endpoints below do not say for themselves, and no longer. Making a
 * call, the grammar, the result fields, the limits and the errors each have a page of their
 * own; restating any of it here reads as repetition on the site and gives it somewhere to
 * drift from everywhere else.
 */
export const API_DESCRIPTION = `
A hosted dice-rolling API powered by [OpenDice](https://www.npmjs.com/package/opendice).
Plain JSON over HTTP, with no key, no signup and no account.

It parses a dice formula, rolls each die through a CSPRNG, and returns every die it rolled
rather than just the answer: ask for \`4d6kh3\` and all four dice come back, with a note of
which three counted.

The routes below are the whole API, each with a ready-made snippet in the language you use.
The documentation at [rollful.dev/docs/api](https://rollful.dev/docs/api/) covers making a
call, reading a result, the limits and the errors.
`.trim()
