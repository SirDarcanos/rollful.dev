// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Every limit the API enforces on top of the ones OpenDice already enforces itself.
 * The site reads these to document them, so there is one source of truth.
 */
export const LIMITS = {
  maxRequestBytes: 8 * 1024,
  maxFormulaLength: 200,
  maxBonuses: 20,
  maxTags: 20,
  maxTagLength: 32,
  maxBatchRolls: 20,
  /**
   * Dice counted across every roll in one request. OpenDice caps a single roll at 1000,
   * but a batch would otherwise multiply that: 20 rolls of `1000d2!` cost about 34ms
   * against the 10ms of CPU a request gets on the Workers free plan.
   */
  maxTotalDice: 1000,
  rateLimit: {
    requests: 60,
    windowSeconds: 60,
  },
} as const
