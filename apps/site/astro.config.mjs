// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://rollful.dev',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
