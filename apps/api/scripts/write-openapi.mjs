// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Writes the OpenAPI document to disk for the site to build its reference from.
 *
 * The document comes from the Worker's own route rather than being maintained separately,
 * so the reference describes what the API actually serves. Writing it to a file rather than
 * fetching the deployed one keeps the site build from depending on production being up, and
 * from racing it: both deploy from the same commit, so a fetch would document the previous
 * version until the API caught up.
 *
 * The Worker is bundled first because it is TypeScript importing TypeScript, which Node
 * cannot run directly. `API_VERSION` is read from the same wrangler config the deployed
 * Worker uses, so the version here is the version it will serve.
 */

import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { unstable_readConfig } from 'wrangler'

const api = resolve(import.meta.dirname, '..')
const bundle = resolve(api, 'node_modules/.cache/openapi/worker.mjs')
const target = resolve(api, '../site/src/openapi.json')

await mkdir(dirname(bundle), { recursive: true })
await build({
  entryPoints: [resolve(api, 'src/index.ts')],
  outfile: bundle,
  bundle: true,
  format: 'esm',
  // Node, because this script runs in Node. Nothing on the /openapi.json path touches a
  // Workers API: the document is built from the same Zod schemas that validate requests.
  platform: 'node',
  logLevel: 'warning',
})

const { vars } = unstable_readConfig({ config: resolve(api, 'wrangler.jsonc') })
const { default: app } = await import(pathToFileURL(bundle).href)

const response = await app.request('/openapi.json', {}, vars)
if (!response.ok) {
  console.error(`The Worker answered /openapi.json with ${response.status}`)
  process.exit(1)
}

await writeFile(target, `${JSON.stringify(await response.json(), null, 2)}\n`)
console.log(`Wrote ${target}`)
