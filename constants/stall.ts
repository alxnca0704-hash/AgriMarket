export const FARM_TYPE_OPTIONS = [
  { key: 'crops', label: 'Crops' },
  { key: 'livestock', label: 'Livestock' },
  { key: 'poultry', label: 'Poultry' },
  { key: 'fisheries', label: 'Fisheries' },
  { key: 'mixed', label: 'Mixed farm' },
  { key: 'cooperative', label: 'Cooperative' },
] as const;

export type FarmType = (typeof FARM_TYPE_OPTIONS)[number]['key'];

export const FARM_TYPE_LABELS: Record<FarmType, string> = FARM_TYPE_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.key]: opt.label }),
  {} as Record<FarmType, string>
);