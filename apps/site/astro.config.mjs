// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi'
import { FATHOM_SNIPPET } from './src/lib/fathom.ts'
import { EXPRESSIVE_CODE_THEMES } from './src/shiki-theme.ts'

export default defineConfig({
  site: 'https://rollful.dev',
  integrations: [
    starlight({
      title: 'Rollful',
      description: 'Documentation for Rollful, a hosted dice-rolling API powered by OpenDice.',
      // Starlight owns only what sits under src/content/docs/docs, so the marketing page
      // and the reference keep their own routes and their own look.
      disable404Route: true,
      customCss: ['./src/styles/starlight.css'],
      // Starlight renders its own document, so the site layout's analytics never reach it.
      head: [{ tag: 'script', content: FATHOM_SNIPPET }],
      // The same syntax colours the rest of the site uses, so code does not change
      // appearance between the marketing page and the documentation.
      expressiveCode: { themes: EXPRESSIVE_CODE_THEMES },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/SirDarcanos/rollful.dev' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/opendice' },
      ],
      editLink: {
        baseUrl: 'https://github.com/SirDarcanos/rollful.dev/edit/main/apps/site/',
      },
      sidebar: [
        { label: 'Getting started', link: '/docs/' },
        { label: 'The formula grammar', link: '/docs/grammar/' },
        { label: 'Using the API', items: [{ autogenerate: { directory: 'docs/api' } }] },
        ...openAPISidebarGroups,
      ],
      plugins: [
        // The reference is generated into Starlight rather than mounted as a separate app,
        // so the documentation and the reference share one sidebar, one search and one
        // theme instead of being two sites that happen to match.
        starlightOpenAPI([
          {
            base: 'reference',
            label: 'API reference',
            schema: './src/openapi.json',
          },
        ]),
      ],
      components: {
        // The docs sit inside a wider site, so the header carries the site's own links back
        // out of them rather than Starlight's default, which only knows about the docs.
        SiteTitle: './src/components/starlight/SiteTitle.astro',
      },
    }),
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
