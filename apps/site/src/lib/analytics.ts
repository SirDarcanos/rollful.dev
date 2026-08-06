// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Nicola Mustone

declare global {
  interface Window {
    fathom?: { trackEvent: (name: string, options?: { _value: number }) => void }
  }
}

/**
 * Record an event, if Fathom is there to record it. It is absent on localhost by design,
 * and briefly absent while its script loads, so this is a no-op rather than a crash in
 * both cases.
 *
 * Names are fixed strings on purpose. Passing something unbounded, a dice formula being
 * the obvious temptation here, would make a report of thousands of one-off rows.
 */
export function track(event: string): void {
  window.fathom?.trackEvent(event)
}
