import type { Grocery } from '../../types/database';
import { GroceryItem } from './GroceryItem';

interface GroceryListProps {
  items: Grocery[];
  onToggle: (id: string, checked: boolean) => void;
  onRemove: (id: string) => void;
}

export function GroceryList({ items, onToggle, onRemove }: GroceryListProps) {
  if (items.length === 0) return null;

  return (
    <div className="overflow-y-auto scrollbar-hide">
      {items.map((item) => (
        <GroceryItem
          key={item.id}
          item={item}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
