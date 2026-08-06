// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

import { track } from './analytics.ts'

/**
 * Make a copy button work: swap its icon to a tick, then back. The markup lives in
 * `CodeBlock.astro`; this is only the behaviour behind it.
 */
export function wireCopy(button: HTMLButtonElement, read: () => string): void {
  const idle = button.querySelector('.copy-idle')
  const done = button.querySelector('.copy-done')
  const label = button.getAttribute('aria-label') ?? 'Copy'

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(read())
      track('Copied a code snippet')
    } catch {
      // Clipboard access can be refused, and a tick would then be a lie.
      button.setAttribute('aria-label', 'Copying was blocked, press Ctrl or Cmd and C')
      return
    }
    idle?.classList.add('hidden')
    done?.classList.remove('hidden')
    // The icon changes silently, so the name carries the result to a screen reader.
    button.setAttribute('aria-label', 'Copied')
    setTimeout(() => {
      done?.classList.add('hidden')
      idle?.classList.remove('hidden')
      button.setAttribute('aria-label', label)
    }, 1600)
  })
}
