// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Syntax colours drawn from the site palette rather than a stock theme, which arrived with
 * an accent of its own and left the code looking like it came from somewhere else.
 *
 * Three levels: the accent for keywords and commands, a paler tint for strings, and the
 * body colour for everything else. Backgrounds are transparent because every code block
 * sits in a container that already has one.
 *
 * Contrast is measured against the surfaces the code actually sits on — `#323232` in dark
 * and `#fafafa` in light — and every colour here clears 4.5:1.
 */

import type { ThemeRegistrationRaw } from 'shiki'

const dark = {
  name: 'rollful-dark',
  type: 'dark',
  colors: {
    'editor.foreground': '#e4e4e7',
    'editor.background': '#00000000',
  },
  settings: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#a1a1aa' } },
    {
      scope: [
        'keyword',
        'keyword.control',
        'storage.type',
        'storage.modifier',
        'entity.name.function',
        'support.function',
        'variable.function',
      ],
      settings: { foreground: '#14ffec' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string'],
      settings: { foreground: '#9be7de' },
    },
    {
      // Object keys carry the accent. Left on the body colour, a JSON response is one
      // undifferentiated block, since its keys are the only structure it has.
      scope: ['support.type.property-name', 'meta.object-literal.key'],
      settings: { foreground: '#14ffec' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'variable', 'meta.definition.variable'],
      settings: { foreground: '#e4e4e7' },
    },
  ],
} satisfies ThemeRegistrationRaw

const light = {
  name: 'rollful-light',
  type: 'light',
  colors: {
    'editor.foreground': '#212121',
    'editor.background': '#00000000',
  },
  settings: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#5f5f68' } },
    {
      scope: [
        'keyword',
        'keyword.control',
        'storage.type',
        'storage.modifier',
        'entity.name.function',
        'support.function',
        'variable.function',
      ],
      settings: { foreground: '#0d7377' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string'],
      settings: { foreground: '#0f5f62' },
    },
    {
      // Object keys carry the accent. Left on the body colour, a JSON response is one
      // undifferentiated block, since its keys are the only structure it has.
      scope: ['support.type.property-name', 'meta.object-literal.key'],
      settings: { foreground: '#0d7377' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'variable', 'meta.definition.variable'],
      settings: { foreground: '#212121' },
    },
  ],
} satisfies ThemeRegistrationRaw

/** For Astro's `<Code>`, which takes one theme per colour scheme. */
export const SHIKI_THEMES = { light, dark }

/**
 * For Starlight, whose Expressive Code takes an ordered list and reads each theme's own
 * `type` to decide which scheme it belongs to.
 *
 * Expressive Code reads VS Code's `tokenColors` where Shiki also accepts TextMate's
 * `settings`. Given only `settings`, it loads the theme and colours nothing, so both keys
 * carry the same list rather than the rules being written out twice.
 *
 * The background is set here because Expressive Code paints the frame from the theme, and
 * the transparent value the site's own blocks rely on would leave it unpainted.
 */
export const EXPRESSIVE_CODE_THEMES = [
  {
    ...dark,
    colors: { ...dark.colors, 'editor.background': '#1c1c1c' },
    tokenColors: dark.settings,
  },
  {
    ...light,
    colors: { ...light.colors, 'editor.background': '#fafafa' },
    tokenColors: light.settings,
  },
]
