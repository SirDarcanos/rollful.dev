// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import { SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { LIMITS } from '@rollful/schema'

const BASE = 'https://api.rollful.dev'

let caller = 0

/** A fresh address per request, so one test cannot spend another test's rate limit. */
function get(path: string): Promise<Response> {
  return SELF.fetch(`${BASE}${path}`, {
    headers: { 'cf-connecting-ip': `10.0.0.${++caller % 250}` },
  })
}

function post(path: string, body: unknown): Promise<Response> {
  return SELF.fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': `10.0.0.${++caller % 250}` },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('the Worker runs OpenDice without Node APIs', () => {
  it('starts and reports health', async () => {
    const response = await get('/v1/health')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok', version: '0.1.0' })
  })

  it('rolls, which exercises crypto.getRandomValues in workerd', async () => {
    const response = await get('/v1/roll?formula=1d20')
    expect(response.status).toBe(200)
    const body = await response.json<{ total: number; dice: { results: number[] }[] }>()
    expect(body.total).toBeGreaterThanOrEqual(1)
    expect(body.total).toBeLessThanOrEqual(20)
    expect(body.dice[0]?.results).toHaveLength(1)
  })
})

describe('the grammar round-trips through the API', () => {
  it('applies a keep rule and reports which dice counted', async () => {
    const response = await get('/v1/roll?formula=4d6kh3')
    const body = await response.json<{
      dice: { results: number[]; kept: number[]; keptFlags: boolean[] }[]
    }>()
    const group = body.dice[0]!
    expect(group.results).toHaveLength(4)
    expect(group.kept).toHaveLength(3)
    expect(group.keptFlags.filter(Boolean)).toHaveLength(3)
  })

  it('reads advantage from the formula', async () => {
    const body = await (
      await get('/v1/roll?formula=2d20adv')
    ).json<{
      advantageState: string
      dice: { results: number[]; kept: number[] }[]
    }>()
    expect(body.advantageState).toBe('advantage')
    expect(body.dice[0]?.results).toHaveLength(2)
    expect(body.dice[0]?.kept).toHaveLength(1)
  })

  it('throws every die an advantage formula asks for', async () => {
    const body = await (
      await get('/v1/roll?formula=4d20adv')
    ).json<{
      dice: { results: number[]; kept: number[] }[]
    }>()
    expect(body.dice[0]?.results).toHaveLength(4)
    expect(body.dice[0]?.kept).toHaveLength(1)
  })

  it('applies advantage requested in the body', async () => {
    const body = await (
      await post('/v1/roll', { formula: '1d20+7', advantage: 'advantage' })
    ).json<{ advantageState: string; modifier: number; dice: { results: number[] }[] }>()
    expect(body.advantageState).toBe('advantage')
    expect(body.modifier).toBe(7)
    expect(body.dice[0]?.results).toHaveLength(2)
  })

  it('keeps a group multiplier bound to its group', async () => {
    const body = await (
      await get('/v1/roll?formula=1d6x10')
    ).json<{
      total: number
      dice: { multiplier: number }[]
    }>()
    expect(body.dice[0]?.multiplier).toBe(10)
    expect(body.total % 10).toBe(0)
  })

  it('explodes a die and records the whole chain', async () => {
    const body = await (
      await get('/v1/roll?formula=100d6!')
    ).json<{
      dice: { results: number[] }[]
    }>()
    expect(body.dice[0]!.results.length).toBeGreaterThanOrEqual(100)
  })

  it('penetrates, which is the one case results can hold a zero', async () => {
    const zeroSeen = await Promise.all(
      Array.from({ length: 40 }, async () => {
        const body = await (
          await post('/v1/roll', { formula: '20d2!p' })
        ).json<{ dice: { results: number[]; kept: number[]; total: number }[] }>()
        const group = body.dice[0]!
        expect(group.results.length).toBeGreaterThanOrEqual(20)
        expect(group.kept.reduce((a, b) => a + b, 0)).toBe(group.total)
        return group.results.includes(0)
      }),
    )
    expect(zeroSeen.some(Boolean)).toBe(true)
  })

  it('accepts a trailing tag only when the request lists it', async () => {
    const accepted = await post('/v1/roll', { formula: '2d6 fire', tags: ['fire'] })
    expect(accepted.status).toBe(200)
    expect((await accepted.json<{ tag: string }>()).tag).toBe('fire')

    const rejected = await post('/v1/roll', { formula: '2d6 fire' })
    expect(rejected.status).toBe(400)
  })

  it('adds bonuses given as numbers and as fragments', async () => {
    const body = await (
      await post('/v1/roll', { formula: '1d8', bonuses: [3, '1d4'] })
    ).json<{ dice: unknown[]; modifier: number }>()
    expect(body.dice).toHaveLength(2)
    expect(body.modifier).toBe(3)
  })
})

describe('bad input is rejected', () => {
  it('rejects a formula that rolls no dice', async () => {
    const response = await get('/v1/roll?formula=2%2B5')
    expect(response.status).toBe(400)
    expect((await response.json<{ error: { code: string } }>()).error.code).toBe('invalid_formula')
  })

  it('rejects more dice than OpenDice allows', async () => {
    const response = await get('/v1/roll?formula=999999d6')
    expect(response.status).toBe(400)
  })

  it('rejects a formula longer than the API allows', async () => {
    const response = await post('/v1/roll', { formula: '1d6+'.repeat(60) + '1d6' })
    expect(response.status).toBe(400)
    expect((await response.json<{ error: { code: string } }>()).error.code).toBe('invalid_request')
  })

  it('rejects a missing formula', async () => {
    const response = await post('/v1/roll', {})
    expect(response.status).toBe(400)
    expect((await response.json<{ error: { code: string } }>()).error.code).toBe('invalid_request')
  })

  it('returns an inert message for a formula full of stray characters', async () => {
    const response = await post('/v1/roll', { formula: '2d6\n<script>' })
    expect(response.status).toBe(400)
    const message = (await response.json<{ error: { message: string } }>()).error.message
    expect(message).not.toContain('<script>')
  })
})

describe('the guards the API adds', () => {
  it('rejects a body over the size limit', async () => {
    const padded = JSON.stringify({ formula: '1d20', pad: 'x'.repeat(LIMITS.maxRequestBytes) })
    const response = await post('/v1/roll', padded)
    expect(response.status).toBe(413)
    expect((await response.json<{ error: { code: string } }>()).error.code).toBe(
      'payload_too_large',
    )
  })

  it('rejects a batch with too many rolls', async () => {
    const rolls = Array.from({ length: LIMITS.maxBatchRolls + 1 }, () => ({ formula: '1d6' }))
    const response = await post('/v1/roll/batch', { rolls })
    expect(response.status).toBe(400)
    expect((await response.json<{ error: { code: string } }>()).error.code).toBe('invalid_request')
  })

  it('rejects a batch whose dice exceed the budget across rolls', async () => {
    const rolls = Array.from({ length: 20 }, () => ({ formula: '100d6' }))
    const response = await post('/v1/roll/batch', { rolls })
    expect(response.status).toBe(400)
    expect((await response.json<{ error: { code: string } }>()).error.code).toBe('too_many_dice')
  })

  // The count is read from the parsed term rather than the rolled result, so this pins the
  // two together: an advantage formula throws what it asks for, and is charged for it.
  it('charges an advantage formula for every die it throws', async () => {
    const rolls = Array.from({ length: 6 }, () => ({ formula: '200d20adv' }))
    const response = await post('/v1/roll/batch', { rolls })
    expect(response.status).toBe(400)
    expect((await response.json<{ error: { code: string } }>()).error.code).toBe('too_many_dice')
  })

  it('allows a batch that stays inside the budget', async () => {
    const rolls = [{ formula: '1d20' }, { formula: '4d6kh3' }, { formula: '2d6+3' }]
    const response = await post('/v1/roll/batch', { rolls })
    expect(response.status).toBe(200)
    expect((await response.json<{ rolls: unknown[] }>()).rolls).toHaveLength(3)
  })

  it('handles the worst affordable roll', async () => {
    const response = await post('/v1/roll', { formula: '1000d2!' })
    expect(response.status).toBe(200)
    const body = await response.json<{ dice: { results: number[] }[] }>()
    expect(body.dice[0]!.results.length).toBeGreaterThanOrEqual(1000)
  })
})

describe('HTTP behaviour', () => {
  it('answers a CORS preflight', async () => {
    const response = await SELF.fetch(`${BASE}/v1/roll`, {
      method: 'OPTIONS',
      headers: { origin: 'https://rollful.dev', 'access-control-request-method': 'POST' },
    })
    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('allows any origin on a real response', async () => {
    const response = await get('/v1/roll?formula=1d6')
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('returns the error shape for an unknown route', async () => {
    const response = await get('/v1/nope')
    expect(response.status).toBe(404)
    expect((await response.json<{ error: { code: string } }>()).error.code).toBe('not_found')
  })

  it('rate limits one address without affecting another', async () => {
    const hammer = async (ip: string, times: number) => {
      const codes: number[] = []
      for (let i = 0; i < times; i++) {
        const response = await SELF.fetch(`${BASE}/v1/roll?formula=1d6`, {
          headers: { 'cf-connecting-ip': ip },
        })
        codes.push(response.status)
      }
      return codes
    }

    const codes = await hammer('203.0.113.9', LIMITS.rateLimit.requests + 5)
    expect(codes.indexOf(429)).toBe(LIMITS.rateLimit.requests)
    expect(codes.at(-1)).toBe(429)

    expect(await hammer('203.0.113.10', 1)).toEqual([200])
  })
})

describe('the OpenAPI document', () => {
  it('describes every route it serves', async () => {
    const response = await get('/openapi.json')
    expect(response.status).toBe(200)
    const doc = await response.json<{
      openapi: string
      paths: Record<string, Record<string, unknown>>
      components: { schemas: Record<string, unknown> }
    }>()
    expect(doc.openapi).toBe('3.1.0')
    expect(Object.keys(doc.paths).sort()).toEqual(['/v1/health', '/v1/roll', '/v1/roll/batch'])
    expect(doc.paths['/v1/roll']).toHaveProperty('get')
    expect(doc.paths['/v1/roll']).toHaveProperty('post')
    expect(doc.components.schemas).toHaveProperty('RollResponse')
    expect(doc.components.schemas).toHaveProperty('BadRequestError')
  })

  it('documents the limits it enforces', async () => {
    const doc = await (await get('/openapi.json')).json<Record<string, unknown>>()
    expect(JSON.stringify(doc)).toContain(String(LIMITS.maxFormulaLength))
  })

  it('gives each error status its own schema, not one shared shape', async () => {
    const doc = await (
      await get('/openapi.json')
    ).json<{
      paths: Record<string, Record<string, { responses: Record<string, ResponseObject> }>>
    }>()
    const responses = doc.paths['/v1/roll']!.get!.responses
    const ref = (status: string) => responses[status]!.content['application/json'].schema.$ref

    expect(new Set(['400', '413', '429', '500'].map(ref)).size).toBe(4)
  })

  /**
   * The reference once showed an identical body for every error status, because each one
   * pointed at the same schema with no example. A 400 carries any of three codes, so its
   * example is only illustrative; 413 has exactly one, and must match byte for byte.
   */
  it('documents the 413 body it actually returns', async () => {
    const doc = await (
      await get('/openapi.json')
    ).json<{
      components: { schemas: Record<string, { examples?: { error: ErrorBody }[] }> }
      paths: Record<string, Record<string, { responses: Record<string, ResponseObject> }>>
    }>()

    const response = await post(
      '/v1/roll',
      JSON.stringify({ formula: '1d20', pad: 'x'.repeat(LIMITS.maxRequestBytes) }),
    )
    expect(response.status).toBe(413)
    const actual = (await response.json<{ error: ErrorBody }>()).error

    const name =
      doc.paths['/v1/roll']!.post!.responses['413']!.content['application/json'].schema.$ref.split(
        '/',
      ).pop()!

    expect(doc.components.schemas[name]!.examples![0]!.error).toEqual(actual)
  })

  it('only documents codes each status can actually carry', async () => {
    const doc = await (
      await get('/openapi.json')
    ).json<{
      components: {
        schemas: Record<
          string,
          { properties?: { error: { properties: { code: { enum: string[] } } } } } & {
            examples?: { error: ErrorBody }[]
          }
        >
      }
    }>()

    for (const [name, schema] of Object.entries(doc.components.schemas)) {
      if (!name.endsWith('Error')) continue
      const codes = schema.properties!.error.properties.code.enum
      expect(codes.length).toBeGreaterThan(0)
      expect(codes).toContain(schema.examples![0]!.error.code)
    }
  })
})

interface ErrorBody {
  code: string
  message: string
}

interface ResponseObject {
  content: { 'application/json': { schema: { $ref: string } } }
}
