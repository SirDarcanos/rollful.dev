// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Refuses to deploy a build that points at a developer's machine. A local `.env` is read by
 * `astro build` as well as `astro dev`, so a hand deploy once shipped a reference that
 * fetched its document from localhost. `.env.production` prevents it; this proves it.
 *
 * Only HTML is checked. The configured origin reaches the page as a `data-` attribute, so
 * that is where a wrong one shows up, while the JavaScript bundles carry Scalar's own HTTP
 * client, which mentions localhost for reasons of its own.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname

/**
 * A local address used as an origin, rather than any mention of one. The analytics snippet
 * names localhost on purpose, to keep itself from reporting there, and matching bare words
 * flagged that as a failure.
 */
const FORBIDDEN = /(https?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* files(path)
    else yield path
  }
}

const offenders = []
for await (const path of files(DIST)) {
  if (!path.endsWith('.html')) continue
  const match = FORBIDDEN.exec(await readFile(path, 'utf8'))
  if (match) offenders.push(`${path.slice(DIST.length)}: ${match[0]}`)
}

if (offenders.length > 0) {
  console.error('This build points at a local address and must not be deployed:')
  for (const offender of offenders) console.error(`  ${offender}`)
  console.error('\nA local apps/site/.env overrode .env.production, or a URL is hardcoded.')
  process.exit(1)
}

console.log('Build contains no local addresses.')
