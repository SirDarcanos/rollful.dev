// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi'
import { FATHOM_SNIPPET } from './src/lib/fathom.ts'
import { hideEndpointsOverview } from './src/starlight/endpoints-overview.ts'

const SITE = 'https://rollful.dev'

export default defineConfig({
  site: SITE,
  integrations: [
    starlight({
      title: 'Rollful',
      description: 'Documentation for Rollful, a hosted dice-rolling API powered by OpenDice.',
      // Starlight owns only what sits under src/content/docs/docs, so the marketing page
      // and the reference keep their own routes and their own look.
      disable404Route: true,
      customCss: ['./src/styles/starlight.css'],
      // Starlight renders its own document, so what the site layout puts in the head never
      // reaches it: the analytics, and the card a link to a documentation page unfurls with.
      // Starlight writes the rest of the card itself, including a `summary_large_image` that
      // shows as a plain link until there is an image to go with it.
      head: [
        { tag: 'script', content: FATHOM_SNIPPET },
        { tag: 'meta', attrs: { property: 'og:image', content: `${SITE}/og.png` } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:alt',
            content: 'Rollful — roll dice anywhere, show the work.',
          },
        },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${SITE}/og.png` } },
      ],
      // No `expressiveCode` here: Starlight's own Night Owl is the site's code theme, and
      // the marketing page names the same two Shiki themes. See src/lib/code-themes.ts.
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/SirDarcanos/rollful.dev' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/opendice' },
      ],
      editLink: {
        baseUrl: 'https://github.com/SirDarcanos/rollful.dev/edit/main/apps/site/',
      },
      // One group per surface, because which one you want is the first decision a reader
      // makes: /docs/ documents the npm package, /docs/api/ the REST API. The generated
      // endpoints are nested inside the REST API group rather than sitting beside it, so
      // the sidebar matches the routes.
      sidebar: [
        {
          label: 'The OpenDice package',
          items: [
            { label: 'Getting started', link: '/docs/' },
            { label: 'The formula grammar', link: '/docs/grammar/' },
          ],
        },
        {
          label: 'The REST API',
          items: [{ autogenerate: { directory: 'docs/api' } }, ...openAPISidebarGroups],
        },
      ],
      plugins: [
        // The reference is generated into Starlight rather than mounted as a separate app,
        // so the documentation and the reference share one sidebar, one search and one
        // theme instead of being two sites that happen to match.
        starlightOpenAPI([
          {
            // Under /docs/api rather than at it: the REST API's own first page is written by
            // hand, and this generates the endpoint-by-endpoint reference below it.
            base: 'docs/api/endpoints',
            label: 'Endpoints',
            schema: './src/openapi.json',
            // The document's own introduction promises a snippet in the language you use,
            // and the default is only fetch and curl. These are every client the plugin can
            // generate; the API needs nothing from a client beyond a request, so each one
            // works as printed.
            snippets: {
              operation: {
                clients: {
                  shell: ['curl', 'wget'],
                  javascript: ['fetch', 'axios'],
                  go: ['nethttp'],
                  java: ['nethttp', 'okhttp'],
                  csharp: ['httpclient'],
                  kotlin: ['okhttp'],
                  rust: ['reqwest'],
                  c: ['libcurl'],
                },
              },
            },
          },
        ]),
        // After starlightOpenAPI, which is what lets it see the generated group.
        hideEndpointsOverview(),
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
