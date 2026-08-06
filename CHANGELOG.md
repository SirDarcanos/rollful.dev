# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The dice-rolling API as a Cloudflare Worker, serving `api.rollful.dev`.
  - `GET /v1/roll` for a roll from a query string.
  - `POST /v1/roll` for a roll with bonuses and tags.
  - `POST /v1/roll/batch` for several rolls in one request.
  - `GET /v1/health` for a liveness check.
  - `GET /openapi.json` for the OpenAPI 3.1 document, generated from the same Zod schemas
    that validate requests.
- Request guards on top of the limits OpenDice already enforces: an 8 KB body, a
  200-character formula, 20 bonuses per roll, 20 rolls per batch, 1000 dice counted across
  a whole request, and 60 requests every 60 seconds per address.
- `@rollful/schema`, holding the request and response schemas and every limit the API adds,
  shared with the site.
- Tests running inside workerd, covering the grammar, each guard, CORS, rate limiting and
  the OpenAPI document.
- `@rollful/site`, an Astro site, with the interactive API reference at `/reference`.
  Scalar is bundled rather than loaded from a CDN, and the API it talks to is set by
  `PUBLIC_ROLLFUL_API` so the reference can be pointed at a local Worker.
- A quick start in the OpenAPI document's description, covering the npm package, `fetch`
  and a non-JavaScript client.
- A schema per error status, each listing only the codes that status can carry and quoting
  the message the API really returns. The messages live in `@rollful/schema` so the Worker
  and the document cannot disagree, and a test pins the two together.
- Deployment for the site, as a Worker with an assets binding serving `rollful.dev`, with a
  workflow that runs when the site or the schemas it reads change.
- Penetrating dice, from OpenDice 1.2.0: `1d6!p` explodes like `1d6!`, but every roll after
  the first counts one less. A penetrated 1 is recorded as `0`, so `results` can now hold a
  number below 1, which the response schema documents.
- A description for each tag in the OpenAPI document, so a reference has something to show
  beside `Rolling` and `Service` rather than an empty column.
- The marketing page at `rollful.dev`: the install command, a roller against the live API
  that prints its working, and the case for the package over the API. The API reference
  carries the site header and the same palette.
- Fathom analytics on the site, loaded only when the page is served from a real host, with
  events for rolling, presets, copying a snippet and opening the reference.

- Documentation at `rollful.dev/docs`, built with Starlight: getting started with the
  package, the formula grammar, making a call, reading a result, limits and errors. Making a
  call shows a first request in curl, JavaScript, Python, PHP, Go and Ruby. The limits page
  reads its numbers from `@rollful/schema`, so it cannot drift from the guard.

### Changed

- OpenDice 1.3.0, where `adv` and `dis` keep the count they were written with: `4d20adv`
  now throws four d20 and keeps the highest, rather than being cut back to two without a
  word. A count of 1 is deprecated — `1d20adv` still rolls two dice, but `2d20adv` is the
  formula it means, and a future version will refuse the shorter one. The documentation, the
  home page presets and the tests all say `2d20adv` now. The `advantage` field is unchanged
  and still takes a plain `1d20`.
- The documentation is split by surface, since which one you want is the first decision a
  reader makes. `/docs` covers the OpenDice package — installing it, what `roll()` returns,
  and the formula grammar. `/docs/api` covers the REST API — making a call, the result
  fields, the limits, the errors — with the generated endpoint reference under
  `/docs/api/endpoints`. It is called the REST API rather than the API reference, which is
  what it is: OpenDice is the other way in, and neither is "the reference".
- The reference is generated into Starlight from the OpenAPI document rather than
  mounted as a separate Scalar application, so the documentation and the reference share
  one sidebar, one search and one theme. It is read-only in exchange: the reference offers
  copyable snippets in many languages where Scalar could send the request for you.
- The OpenAPI document is written to a file by the Worker itself, and the reference builds
  from that. Pointing at the deployed document would have documented the previous version
  until the API caught up, since both deploy from the same commit.
- The reference moved from `/reference` to `/docs/api`, beside the hand-written pages about
  calling the API rather than on a route of its own. `/reference` was where Scalar had been
  mounted as a separate application, and nothing needed it once the reference became part of
  the documentation.
- The document's introduction introduces the endpoints rather than repeating the
  documentation. The quick start, the result fields and the limits were all restated there
  while the reference stood alone; each has a page of its own now, and the introduction says
  what the API is and where the rest lives.
- Operation snippets in every language the generator supports — C, C#, Go, Java, JavaScript,
  Kotlin, Rust and shell — rather than the default of `fetch` and `curl` alone.
- No "Overview" links in the generated endpoint groups. The one at the top pointed at a page
  the documentation already had, since "Making a call" opens the REST API, and the one in each
  tag was that tag's description above a list of the endpoints beside it. What is left in the
  sidebar is the endpoints. `starlight-openapi` adds those links with no way to turn them off,
  so a small local Starlight plugin drops them and repairs the pagination that pointed at
  them.

### Fixed

- The site deploy's health check followed no redirects, so it requested `/reference`, was
  answered with a 307 to `/reference/`, and failed a deploy that had succeeded. It now
  follows the redirect and checks the page points at the production API.
