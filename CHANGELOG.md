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
