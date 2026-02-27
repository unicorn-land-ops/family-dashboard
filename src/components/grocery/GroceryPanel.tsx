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

  // --- Compact variant (wall display sidebar / kiosk) ---
  if (variant === 'compact') {
    const uncheckedItems = items.filter((i) => !i.checked);

    return (
      <div className="card-glass p-4">
        <h3
          className="font-semibold mb-2"
          style={{
            fontSize: 'clamp(0.82rem, 1vw, 1rem)',
            color: 'var(--fd-text-2)',
          }}
        >
          Groceries ({uncheckedCount})
        </h3>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          {uncheckedItems.length === 0 ? (
            <p
              className="text-center py-2"
              style={{ color: 'var(--fd-text-2)', opacity: 0.5, fontSize: 'clamp(0.8rem, 0.95vw, 1rem)' }}
            >
              All stocked
            </p>
          ) : (
            <ul className="flex flex-col gap-[clamp(4px,0.5vw,8px)]">
              {uncheckedItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline gap-2"
                  style={{
                    fontSize: 'clamp(0.85rem, 1vw, 1.05rem)',
                    color: 'var(--fd-text-1)',
                  }}
                >
                  <span style={{ color: 'var(--fd-accent)', fontSize: '0.5em', lineHeight: 1 }}>●</span>
                  <span className="truncate">{item.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // --- Full variant (mobile) ---

  // Supabase not configured
  if (!supabaseEnabled) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-center py-8" style={{ color: 'var(--fd-text-2)', opacity: 0.5 }}>
          Connect Supabase to use grocery list
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--fd-text-1)' }}>
          Groceries ({uncheckedCount})
        </h2>
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={() => clearChecked()}
            className="text-sm hover:opacity-80"
            style={{ color: 'var(--fd-text-2)' }}
          >
            Clear done
          </button>
        )}
      </div>

      {/* List area */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--fd-text-2)', opacity: 0.5 }}>No items yet</p>
        ) : (
          <GroceryList
            items={items}
            onToggle={toggleItem}
            onRemove={removeItem}
          />
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--fd-bg-1) 80%, transparent)', borderTop: '1px solid var(--fd-card-border)' }}>
        <GroceryInput onAdd={addItem} />
      </div>
    </div>
  );
}
