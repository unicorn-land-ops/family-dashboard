import { useGroceries } from '../../hooks/useGroceries';
import { supabaseEnabled } from '../../lib/supabase';
import { GroceryInput } from './GroceryInput';
import { GroceryList } from './GroceryList';

interface GroceryPanelProps {
  variant?: 'full' | 'compact';
}

export function GroceryPanel({ variant = 'full' }: GroceryPanelProps) {
  const { items, addItem, toggleItem, removeItem, clearChecked, uncheckedCount } =
    useGroceries();

  const checkedCount = items.filter((i) => i.checked).length;

  // --- Compact variant (wall display sidebar) ---
  if (variant === 'compact') {
    const uncheckedItems = items.filter((i) => !i.checked);

    return (
      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
          Groceries ({uncheckedCount})
        </h3>
        <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
          <GroceryList
            items={uncheckedItems}
            onToggle={toggleItem}
            onRemove={removeItem}
          />
        </div>
      </div>
    );
  }

  // --- Full variant (mobile) ---

  // Supabase not configured
  if (!supabaseEnabled) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-white/30 text-center py-8">
          Connect Supabase to use grocery list
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h2 className="text-lg font-semibold text-white">
          Groceries ({uncheckedCount})
        </h2>
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={() => clearChecked()}
            className="text-sm text-white/40 hover:text-white/60"
          >
            Clear done
          </button>
        )}
      </div>

      {/* List area */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-white/30 text-center py-8">No items yet</p>
        ) : (
          <GroceryList
            items={items}
            onToggle={toggleItem}
            onRemove={removeItem}
          />
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 bg-bg-primary/80 backdrop-blur-sm border-t border-white/10">
        <GroceryInput onAdd={addItem} />
      </div>
    </div>
  );
}
