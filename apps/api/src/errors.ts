// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import type { ErrorCode } from '@rollful/schema'

export class ApiError extends Error {
  constructor(
    readonly status: 400 | 404 | 405 | 413 | 429 | 500,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message)
  }
}

/**
 * A rejected draw means the CSPRNG is broken rather than that the request was bad. Every
 * other error OpenDice throws is input validation, and its message is already safe to
 * return: `excerpt()` in the parser replaces any character a formula cannot contain.
 */
const BROKEN_RANDOM_SOURCE = /^rollDie: the random source rejected/

export function asApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  const message = error instanceof Error ? error.message : String(error)
  if (BROKEN_RANDOM_SOURCE.test(message)) {
    return new ApiError(500, 'internal_error', 'The random source failed. Try again.')
  }
  return new ApiError(400, 'invalid_formula', message)
}
