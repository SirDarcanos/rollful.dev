// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * The Rollful API. Rolling itself lives in OpenDice; this Worker adds the guards a public
 * endpoint needs and generates its own OpenAPI document from the schemas it validates with.
 */

import { OpenAPIHono } from '@hono/zod-openapi'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { ERROR_MESSAGES, LIMITS } from '@rollful/schema'
import { API_DESCRIPTION } from './description.ts'
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
      throw new ApiError(413, 'payload_too_large', ERROR_MESSAGES.payloadTooLarge)
    },
  }),
)

app.use('/v1/*', async (c, next) => {
  const key = c.req.header('cf-connecting-ip') ?? 'anonymous'
  const { success } = await c.env.ROLL_RATE_LIMITER.limit({ key })
  if (!success) {
    throw new ApiError(429, 'rate_limited', ERROR_MESSAGES.rateLimited)
  }
  await next()
})

registerRollRoutes(app)

// The document describes the production API wherever it is served from, including a local
// Worker. A client pointed at a different origin overrides this; deriving it from the
// request does not work, because `wrangler dev` reports the configured Custom Domain host.
app.doc31('/openapi.json', (c) => ({
  openapi: '3.1.0',
  info: {
    title: 'Rollful',
    version: c.env.API_VERSION,
    description: API_DESCRIPTION,
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  },
  servers: [{ url: 'https://api.rollful.dev', description: 'Production' }],
  // Every route carries one of these tags. Without a description here, a reference renders
  // the group heading against an empty column.
  tags: [
    {
      name: 'Rolling',
      description:
        'Rolling dice. One roll from a query string for links and `curl`, the same roll from a body when it carries bonuses or tags, and a batch when several rolls should happen together. Every response reports each die, not only the total.',
    },
    {
      name: 'Service',
      description: 'Whether the API is up. Rolls nothing, and is not rate limited differently.',
    },
  ],
}))

app.notFound(() => {
  throw new ApiError(404, 'not_found', ERROR_MESSAGES.notFound)
})

app.onError((error, c) => {
  const { status, code, message } = asApiError(error)
  if (status === 500) console.error(error)
  return c.json({ error: { code, message } }, status)
})

export default app
