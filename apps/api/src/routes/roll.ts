// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import {
  BatchRollRequest,
  BatchRollResponse,
  ErrorResponse,
  HealthResponse,
  RollQuery,
  RollRequest,
  RollResponse,
} from '@rollful/schema'
import { assertWithinDiceBudget, performRoll } from '../dice.ts'

type App = OpenAPIHono<{ Bindings: Env }>

const json = <T>(schema: T, description: string) => ({
  description,
  content: { 'application/json': { schema } },
})

const errors = {
  400: json(ErrorResponse, 'The request or the formula was rejected.'),
  413: json(ErrorResponse, 'The request body was too large.'),
  429: json(ErrorResponse, 'Rate limit exceeded.'),
  500: json(ErrorResponse, 'The random source failed.'),
}

const rollFromQuery = createRoute({
  method: 'get',
  path: '/v1/roll',
  tags: ['Rolling'],
  summary: 'Roll a formula from a query string',
  description: 'The link- and curl-friendly form. Use POST for bonuses and tags.',
  request: { query: RollQuery },
  responses: { 200: json(RollResponse, 'The roll, with every die it rolled.'), ...errors },
})

const rollOne = createRoute({
  method: 'post',
  path: '/v1/roll',
  tags: ['Rolling'],
  summary: 'Roll a formula',
  request: {
    body: { required: true, content: { 'application/json': { schema: RollRequest } } },
  },
  responses: { 200: json(RollResponse, 'The roll, with every die it rolled.'), ...errors },
})

const rollBatch = createRoute({
  method: 'post',
  path: '/v1/roll/batch',
  tags: ['Rolling'],
  summary: 'Roll several formulas in one request',
  description: 'Dice are counted across every roll in the request, not per roll.',
  request: {
    body: { required: true, content: { 'application/json': { schema: BatchRollRequest } } },
  },
  responses: { 200: json(BatchRollResponse, 'One result per requested roll.'), ...errors },
})

const health = createRoute({
  method: 'get',
  path: '/v1/health',
  tags: ['Service'],
  summary: 'Liveness check',
  responses: { 200: json(HealthResponse, 'The service is running.') },
})

export function registerRollRoutes(app: App): void {
  app.openapi(rollFromQuery, (c) => {
    const request = c.req.valid('query')
    assertWithinDiceBudget([request])
    return c.json(performRoll(request), 200)
  })

  app.openapi(rollOne, (c) => {
    const request = c.req.valid('json')
    assertWithinDiceBudget([request])
    return c.json(performRoll(request), 200)
  })

  app.openapi(rollBatch, (c) => {
    const { rolls } = c.req.valid('json')
    assertWithinDiceBudget(rolls)
    return c.json({ rolls: rolls.map(performRoll) }, 200)
  })

  app.openapi(health, (c) => c.json({ status: 'ok' as const, version: c.env.API_VERSION }, 200))
}
