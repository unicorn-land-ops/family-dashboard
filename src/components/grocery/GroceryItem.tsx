import { IoCheckmarkCircle, IoEllipseOutline, IoTrashOutline } from 'react-icons/io5';
import type { Grocery } from '../../types/database';

interface GroceryItemProps {
  item: Grocery;
  onToggle: (id: string, checked: boolean) => void;
  onRemove: (id: string) => void;
}

export function GroceryItem({ item, onToggle, onRemove }: GroceryItemProps) {
  return (
    <div className="flex items-center gap-3 min-h-[44px] px-3 py-2">
      {/* Checkbox toggle */}
      <button
        type="button"
        onClick={() => onToggle(item.id, !item.checked)}
        className="flex items-center justify-center w-[44px] h-[44px] shrink-0"
        aria-label={item.checked ? 'Uncheck' : 'Check'}
      >
        {item.checked ? (
          <IoCheckmarkCircle className="w-6 h-6 text-green-400" />
        ) : (
          <IoEllipseOutline className="w-6 h-6 text-white/40" />
        )}
      </button>

      {/* Item name */}
      <span
        className={`flex-1 text-base ${
          item.checked ? 'line-through text-white/30' : 'text-white'
        }`}
      >
        {item.name}
      </span>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="flex items-center justify-center w-[44px] h-[44px] shrink-0 text-white/20 hover:text-red-400 transition-colors"
        aria-label="Remove"
      >
        <IoTrashOutline className="w-5 h-5" />
      </button>
    </div>
  );
}
