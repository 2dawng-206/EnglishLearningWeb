import { ValueTransformer } from 'typeorm';

/**
 * The mysql2 driver returns MySQL DECIMAL columns as strings (not numbers),
 * to avoid silently losing precision on values that don't fit in a JS float.
 * `ease_factor` needs real arithmetic in the SM-2 service (Phase 3), so we
 * transform DB string <-> JS number at the entity boundary.
 *
 * Usage: @Column({ type: 'decimal', precision: 5, scale: 4, transformer: DecimalColumnTransformer })
 */
export const DecimalColumnTransformer: ValueTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | null): number | null =>
    value === null ? null : parseFloat(value),
};
