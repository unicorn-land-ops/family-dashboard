export interface GroceryPreference {
  key: string;
  canonicalName: string;
  aliases: string[];
  knusprSearchHint?: string;
}

// Preferred products for normalized grocery ordering.
// Extend this list as your household defaults become clear.
export const GROCERY_PREFERENCES: GroceryPreference[] = [
  {
    key: 'milk',
    canonicalName: 'full fat bio milk',
    aliases: [
      'milk',
      'whole milk',
      'full fat milk',
      'full-fat milk',
      'bio milk',
      'organic whole milk',
      'vollmilch',
      'bio vollmilch',
      'full fat bio milk',
    ],
    knusprSearchHint: 'bio vollmilch 3.8%',
  },
];

function normalizeAlias(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ');
}

function splitQuantityPrefix(input: string): { quantity: string | null; item: string } {
  const trimmed = input.trim();
  const quantityMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (!quantityMatch) {
    return { quantity: null, item: trimmed };
  }

  return {
    quantity: quantityMatch[1],
    item: quantityMatch[2].trim(),
  };
}

export function resolveGroceryPreference(input: string): {
  normalizedName: string;
  preference: GroceryPreference | null;
} {
  const { quantity, item } = splitQuantityPrefix(input);
  const normalizedItem = normalizeAlias(item);

  const preference =
    GROCERY_PREFERENCES.find((entry) =>
      entry.aliases.some((alias) => normalizeAlias(alias) === normalizedItem),
    ) ?? null;

  if (!preference) {
    return { normalizedName: input.trim(), preference: null };
  }

  const normalizedName = quantity
    ? `${quantity} ${preference.canonicalName}`
    : preference.canonicalName;

  return { normalizedName, preference };
}

export function toPreferredGroceryName(input: string): string {
  return resolveGroceryPreference(input).normalizedName;
}
