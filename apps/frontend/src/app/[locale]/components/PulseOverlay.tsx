/**
 * @file Pulse Overlay Component
 *
 * Interactive overlay component for capturing cursor movement and triggering pulse effects.
 */

import React from 'react';

export interface PulseOverlayProps {
  onMouseMove: (event: React.MouseEvent) => void;
}

/**
 * Interactive overlay for pulse effects.
 *
 * Captures cursor movement and triggers pulse generation.
 * Must be rendered last to capture cursor movement.
 */
export default function PulseOverlay({ onMouseMove }: PulseOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20"
      onMouseMove={onMouseMove}
      aria-label="Interactive landing page - move cursor to create pulse effects"
      data-testid="pulse-trigger-overlay"
    />
  );
}

