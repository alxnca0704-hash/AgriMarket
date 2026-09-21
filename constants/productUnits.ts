export const PRODUCT_UNITS = [
  { key: 'kg', label: 'Per kilogram (kg)' },
  { key: 'bundle', label: 'Per bundle' },
  { key: 'piece', label: 'Per piece' },
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number]['key'];

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = PRODUCT_UNITS.reduce(
  (acc, opt) => ({ ...acc, [opt.key]: opt.label }),
  {} as Record<ProductUnit, string>
);