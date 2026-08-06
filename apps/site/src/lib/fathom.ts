// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Fathom, as a snippet rather than a component, because it has to reach two places that
 * cannot share one: the site's own layout, and Starlight's `head`, which takes raw tags.
 *
 * It loads only when the page is served from a real host. Fathom has no attribute for
 * excluding domains — its guidance is to filter in the dashboard — so the check happens
 * here, which keeps `astro dev` and a local preview of a production build out of the
 * numbers alike.
 *
 * Fathom sets no cookies and collects no personal data, so this needs no consent banner.
 */

const SITE = 'POWIZBZB'

const LOCAL = ['localhost', '127.0.0.1', '[::1]', '::1']

export const FATHOM_SNIPPET = `
if (!${JSON.stringify(LOCAL)}.includes(window.location.hostname)) {
  const fathom = document.createElement('script')
  fathom.src = 'https://cdn.usefathom.com/script.js'
  fathom.dataset.site = '${SITE}'
  fathom.defer = true
  document.head.append(fathom)
}
`.trim()
