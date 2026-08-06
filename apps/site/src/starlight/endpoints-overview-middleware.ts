// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import type { StarlightRouteData } from '@astrojs/starlight/route-data'

type Sidebar = StarlightRouteData['sidebar']
type SidebarEntry = Sidebar[number]
type SidebarLink = Extract<SidebarEntry, { type: 'link' }>

/**
 * The two kinds of page starlight-openapi generates that are not an endpoint, and links as
 * "Overview": one at the schema base, and one per tag. Matched by route rather than by label
 * so the rule survives a change of wording.
 */
const BASE = '/docs/api/endpoints'
const TAG = `${BASE}/operations/tags/`

export const onRequest = defineRouteMiddleware(({ locals }) => {
  const { starlightRoute } = locals
  const sidebar = withoutOverview(starlightRoute.sidebar)
  const { prev, next } = starlightRoute.pagination

  starlightRoute.sidebar = sidebar

  // Only the two pages either side of the dropped link need new neighbours. Recomputing
  // everywhere would quietly replace Starlight's own pagination, which reads `prev` and
  // `next` from frontmatter, with something that cannot.
  if (isOverview(prev) || isOverview(next)) {
    starlightRoute.pagination = neighbours(sidebar)
  }
})

function withoutOverview(sidebar: Sidebar): Sidebar {
  return sidebar.flatMap((entry) => {
    if (entry.type === 'group') return { ...entry, entries: withoutOverview(entry.entries) }
    return isOverview(entry) ? [] : entry
  })
}

function isOverview(entry: SidebarLink | undefined): boolean {
  if (!entry) return false
  const href = entry.href.replace(/(?:index)?(?:\.html)?\/?$/, '')
  return href === BASE || href.startsWith(TAG)
}

function neighbours(sidebar: Sidebar): StarlightRouteData['pagination'] {
  const links = flatten(sidebar)
  const current = links.findIndex((link) => link.isCurrent)
  return current === -1
    ? { prev: undefined, next: undefined }
    : { prev: links[current - 1], next: links[current + 1] }
}

function flatten(sidebar: Sidebar): SidebarLink[] {
  return sidebar.flatMap((entry) => (entry.type === 'group' ? flatten(entry.entries) : entry))
}
