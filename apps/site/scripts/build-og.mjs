// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Rasterises og-card.svg to public/og.png, the image a social scraper is given: none of them
 * render SVG.
 *
 * Run by hand rather than by the build, and the PNG committed. The card is type on a flat
 * background, and type is rasterised with whatever fonts the machine has — running this in
 * CI would redraw it in a runner's fonts and quietly change the card on any deploy.
 *
 *   node scripts/build-og.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const svg = new URL('./og-card.svg', import.meta.url)
const png = new URL('../public/og.png', import.meta.url)

// density scales the rasterisation rather than the SVG, so the text is drawn at 2x and
// resized down: at 1x the stems of the headline are visibly ragged.
const image = await sharp(await readFile(svg), { density: 144 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toBuffer()

await writeFile(png, image)
console.log(`Wrote ${png.pathname} (${(image.byteLength / 1024).toFixed(0)} KB)`)
