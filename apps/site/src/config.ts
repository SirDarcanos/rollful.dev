// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Which API the site talks to. Set PUBLIC_ROLLFUL_API to point the reference and the
 * playground at a local Worker instead of production.
 */
export const API_ORIGIN = import.meta.env.PUBLIC_ROLLFUL_API ?? 'https://api.rollful.dev'

export const OPENAPI_URL = `${API_ORIGIN}/openapi.json`
