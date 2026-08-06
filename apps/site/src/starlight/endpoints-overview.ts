// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import type { StarlightPlugin } from '@astrojs/starlight/types'

/**
 * starlight-openapi opens every group it generates with an "Overview" link, and offers no way
 * to turn them off. None of them earn a row here: "Making a call" already opens the REST API,
 * and a tag's overview is its description above a list of the endpoints the sidebar is
 * showing anyway. What is left is the endpoints themselves.
 *
 * The pages stay where the plugin puts them — the schema overview is the root of the
 * generated routes, and removing it would mean removing the endpoints with it. This drops the
 * links. The tag descriptions are still in the OpenAPI document for anything else rendering
 * it.
 *
 * `order: 'post'` and a place after `starlightOpenAPI()` in the plugin list are both needed:
 * Starlight runs post middleware in plugin order, and the group does not exist until the
 * plugin's own middleware has replaced the placeholder.
 */
export function hideEndpointsOverview(): StarlightPlugin {
  return {
    name: 'rollful-hide-endpoints-overview',
    hooks: {
      'config:setup'({ addRouteMiddleware }) {
        addRouteMiddleware({
          entrypoint: './src/starlight/endpoints-overview-middleware.ts',
          order: 'post',
        })
      },
    },
  }
}
