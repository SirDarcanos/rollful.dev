// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * The adapter between OpenDice and the API. Nothing here decides what a roll means; it
 * counts dice before rolling so a request cannot outrun its CPU budget, and shapes the
 * result for JSON.
 */

import { keptFlags, parseFormula, roll, type Term } from 'opendice'
import { ERROR_MESSAGES, LIMITS, type RollRequest, type RollResponse } from '@rollful/schema'
import { ApiError, asApiError } from './errors.ts'

function diceIn(terms: Term[]): number {
  return terms.reduce((n, term) => (term.kind === 'dice' ? n + term.count : n), 0)
}

/**
 * How many dice a request will roll. Parsing costs about 1% of rolling, so counting first
 * is what makes the batch limit affordable. Throws the same errors rolling would.
 */
export function countDice(request: RollRequest): number {
  let dice = diceIn(parseFormula(request.formula, { tags: request.tags }).terms)
  for (const bonus of request.bonuses ?? []) {
    if (typeof bonus === 'string') dice += diceIn(parseFormula(bonus).terms)
  }
  if (request.advantage && request.advantage !== 'normal') dice += 1
  return dice
}

/** Reject a batch whose dice, summed across every roll, exceed what one request may roll. */
export function assertWithinDiceBudget(requests: RollRequest[]): void {
  let total = 0
  for (const request of requests) {
    try {
      total += countDice(request)
    } catch (error) {
      throw asApiError(error)
    }
    if (total > LIMITS.maxTotalDice) {
      throw new ApiError(400, 'too_many_dice', ERROR_MESSAGES.tooManyDice)
    }
  }
}

export function performRoll(request: RollRequest): RollResponse {
  const result = roll(request.formula, {
    advantage: request.advantage,
    bonuses: request.bonuses,
    tags: request.tags,
  })
  return {
    formula: result.formula,
    dice: result.dice.map((group) => ({
      sides: group.sides,
      sign: group.sign,
      results: group.results,
      kept: group.kept,
      keptFlags: keptFlags(group),
      multiplier: group.multiplier,
      total: group.total,
      naturalHigh: group.naturalHigh,
      naturalLow: group.naturalLow,
    })),
    modifier: result.modifier,
    modifiers: result.modifiers,
    total: result.total,
    advantageState: result.advantageState,
    ...(result.tag !== undefined ? { tag: result.tag } : {}),
  }
}
