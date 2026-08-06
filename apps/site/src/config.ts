// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

/**
 * Which API the home page roller calls. Set PUBLIC_ROLLFUL_API to point it at a local Worker
 * instead of production. The reference does not read this: it builds from the committed
 * document, so it always describes the checkout it is built from.
 */
export const API_ORIGIN = import.meta.env.PUBLIC_ROLLFUL_API ?? 'https://api.rollful.dev'
