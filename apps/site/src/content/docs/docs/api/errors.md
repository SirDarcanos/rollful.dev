---
title: Errors
description: The shape of a Rollful error, every code it can carry, and what to do about each.
sidebar:
  order: 3
---

Every error returns the same shape, with an HTTP status to match.

```json
{
  "error": {
    "code": "invalid_formula",
    "message": "A roll may use at most 1000 dice, but this one asks for 999999"
  }
}
```

Match on `code`. The `message` is written for a person and may be reworded; the code will
not change without a new version of the API.

## The codes

| Status | Code                | Means                                                                          |
| ------ | ------------------- | ------------------------------------------------------------------------------ |
| 400    | `invalid_request`   | the request did not match the schema — a missing formula, a value out of range |
| 400    | `invalid_formula`   | the formula parsed as far as it could and was refused                          |
| 400    | `too_many_dice`     | the request asks for more dice than one request may roll                       |
| 404    | `not_found`         | no such endpoint                                                               |
| 413    | `payload_too_large` | the request body is over the size limit                                        |
| 429    | `rate_limited`      | too many requests from this address                                            |
| 500    | `internal_error`    | the random source failed                                                       |

A given status carries only the codes listed against it. A 429 is always `rate_limited`; a
400 is one of three. The OpenAPI document says so per status, so a generated client can
narrow the type rather than accepting any code anywhere.

## Error messages are safe to show

A formula arrives from somewhere untrusted more often than not, and a parse error is the one
place that input travels back out. Before quoting anything you typed, the parser replaces
every character a formula cannot contain and truncates what is left.

So `2d6<script>` comes back describing a forbidden character rather than echoing the tag.
You can put an error message straight on a page.

## What to do about each

**`invalid_request` and `invalid_formula`** are the caller's to fix. Neither is worth
retrying unchanged.

**`too_many_dice`** means the request as a whole is too large. Split it across requests, or
use the package, which has no such bound.

**`rate_limited`** is worth retrying after a pause. The limit is enforced per Cloudflare
location, so a retry may succeed sooner than the window suggests.

**`internal_error`** means the random source rejected a thousand draws in a row. On a
working system that is a one-in-2^1000 event, so it means something is broken rather than
unlucky. Retry once; if it persists, it is not you.
