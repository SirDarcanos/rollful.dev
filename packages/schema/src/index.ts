// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * The request and response shapes of the Rollful API. These validate incoming requests and
 * generate `/openapi.json`, so an endpoint cannot drift from its own documentation.
 */

import { z } from 'zod'
import { LIMITS } from './limits.ts'

export { LIMITS } from './limits.ts'

export const ADVANTAGE_STATES = ['normal', 'advantage', 'disadvantage'] as const

const formula = z
  .string()
  .min(1)
  .max(LIMITS.maxFormulaLength)
  .meta({ description: 'A dice formula, such as `2d6+3` or `4d6kh3`.', examples: ['2d6+3'] })

const advantage = z.enum(ADVANTAGE_STATES).meta({
  id: 'AdvantageState',
  description: 'Applies to the first plain d20 term. Net advantage and disadvantage yourself.',
})

const bonus = z
  .union([z.int(), z.string().min(1).max(LIMITS.maxFormulaLength)])
  .meta({ description: 'A whole number, or a formula fragment such as `1d4`.' })

const tag = z
  .string()
  .min(1)
  .max(LIMITS.maxTagLength)
  .regex(/^[a-z]+$/, 'A tag must be lowercase letters only')

export const RollRequest = z
  .object({
    formula,
    advantage: advantage.optional(),
    bonuses: z.array(bonus).max(LIMITS.maxBonuses).optional(),
    tags: z.array(tag).max(LIMITS.maxTags).optional().meta({
      description:
        'Trailing words to accept as a tag. A trailing word not listed here is a parse error.',
    }),
  })
  .meta({ id: 'RollRequest' })

export const BatchRollRequest = z
  .object({
    rolls: z.array(RollRequest).min(1).max(LIMITS.maxBatchRolls),
  })
  .meta({ id: 'BatchRollRequest' })

/** The GET form carries only what fits comfortably in a link. Use POST for the rest. */
export const RollQuery = z.object({
  formula,
  advantage: advantage.optional(),
})

export const DieGroup = z
  .object({
    sides: z.int(),
    sign: z.union([z.literal(1), z.literal(-1)]),
    results: z.array(z.int()).meta({ description: 'Every die rolled, including dropped ones.' }),
    kept: z.array(z.int()).meta({ description: 'The dice that counted towards the total.' }),
    keptFlags: z
      .array(z.boolean())
      .meta({ description: 'Aligned to `results`: whether each die was kept.' }),
    multiplier: z.int(),
    total: z.int().meta({ description: "This group's signed contribution to the total." }),
    naturalHigh: z.boolean(),
    naturalLow: z.boolean(),
  })
  .meta({ id: 'DieGroup' })

export const RollResponse = z
  .object({
    formula: z.string(),
    dice: z.array(DieGroup),
    modifier: z.int().meta({ description: 'Sum of the flat modifiers. Dice are not counted.' }),
    modifiers: z.array(z.int()).meta({
      description: 'Each flat modifier in order, so `+1 -6` can be shown rather than -5.',
    }),
    total: z.int(),
    advantageState: advantage,
    tag: z.string().optional(),
  })
  .meta({ id: 'RollResponse' })

export const BatchRollResponse = z
  .object({
    rolls: z.array(RollResponse),
  })
  .meta({ id: 'BatchRollResponse' })

export const ERROR_CODES = [
  'invalid_request',
  'invalid_formula',
  'payload_too_large',
  'too_many_dice',
  'rate_limited',
  'not_found',
  'internal_error',
] as const

export const ErrorResponse = z
  .object({
    error: z.object({
      code: z.enum(ERROR_CODES),
      message: z.string(),
    }),
  })
  .meta({ id: 'ErrorResponse' })

export const HealthResponse = z
  .object({
    status: z.literal('ok'),
    version: z.string(),
  })
  .meta({ id: 'HealthResponse' })

export type AdvantageState = (typeof ADVANTAGE_STATES)[number]
export type ErrorCode = (typeof ERROR_CODES)[number]
export type RollRequest = z.infer<typeof RollRequest>
export type BatchRollRequest = z.infer<typeof BatchRollRequest>
export type RollQuery = z.infer<typeof RollQuery>
export type DieGroup = z.infer<typeof DieGroup>
export type RollResponse = z.infer<typeof RollResponse>
export type BatchRollResponse = z.infer<typeof BatchRollResponse>
export type ErrorResponse = z.infer<typeof ErrorResponse>
