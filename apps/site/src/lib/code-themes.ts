// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Night Owl, which is what Starlight styles code with out of the box. The marketing page
 * names the same two themes so a snippet looks the same wherever it appears, and neither
 * surface has a palette of its own to keep in step with the other.
 *
 * Shiki bundles both under these names, so nothing is vendored here. Starlight's `<Code>`
 * is not reused for the same effect: importing it pulls Starlight's stylesheet onto the
 * marketing page, and its reset outranks Tailwind's layered utilities.
 */
export const SHIKI_THEMES = { light: 'night-owl-light', dark: 'night-owl' } as const
