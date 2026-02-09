/**
 * VatMan domain types.
 * Coordinates stored as percentages (0.0–1.0) for responsiveness.
 */

export type VatStatus = 'empty' | 'in_progress' | 'full' | 'cleaning';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface VatPosition {
  /** X position as percentage of canvas width (0.0–1.0) */
  x: number;
  /** Y position as percentage of canvas height (0.0–1.0) */
  y: number;
}

export interface Vat {
  id: string;
  domainId: string;
  label: string;
  /** Capacity in liters */
  capacity: number;
  status: VatStatus;
  notes?: string;
  /** Position on cellar plan (percentage-based) */
  position: VatPosition;
  createdAt: string;
  updatedAt: string;
}
