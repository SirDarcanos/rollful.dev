// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * The Rollful API. Rolling itself lives in OpenDice; this Worker adds the guards a public
 * endpoint needs and generates its own OpenAPI document from the schemas it validates with.
 */

import { OpenAPIHono } from '@hono/zod-openapi'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { LIMITS } from '@rollful/schema'
import { ApiError, asApiError } from './errors.ts'
import { registerRollRoutes } from './routes/roll.ts'

const app = new OpenAPIHono<{ Bindings: Env }>({
  defaultHook: (result) => {
    if (!result.success) {
      const issue = result.error.issues[0]
      const where = issue?.path.join('.')
      throw new ApiError(
        400,
        'invalid_request',
        where ? `${where}: ${issue?.message}` : (issue?.message ?? 'Invalid request'),
      )
    }
  },
})

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  }),
)

app.use(
  '/v1/*',
  bodyLimit({
    maxSize: LIMITS.maxRequestBytes,
    onError: () => {
      throw new ApiError(
        413,
        'payload_too_large',
        `A request body may be at most ${LIMITS.maxRequestBytes} bytes`,
      )
    },
  }),
)

app.use('/v1/*', async (c, next) => {
  const key = c.req.header('cf-connecting-ip') ?? 'anonymous'
  const { success } = await c.env.ROLL_RATE_LIMITER.limit({ key })
  if (!success) {
    throw new ApiError(
      429,
      'rate_limited',
      `At most ${LIMITS.rateLimit.requests} requests every ${LIMITS.rateLimit.windowSeconds} seconds`,
    )
  }
  await next()
})

registerRollRoutes(app)

app.doc31('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Rollful',
    version: '1.0.0',
    description: 'A hosted dice-rolling API powered by OpenDice.',
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  },
  servers: [{ url: 'https://api.rollful.dev', description: 'Production' }],
})

app.notFound(() => {
  throw new ApiError(404, 'not_found', 'No such endpoint')
})

app.onError((error, c) => {
  const { status, code, message } = asApiError(error)
  if (status === 500) console.error(error)
  return c.json({ error: { code, message } }, status)
})

export default app
