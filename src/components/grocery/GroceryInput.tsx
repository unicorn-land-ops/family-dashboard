import { useState, type FormEvent } from 'react';

interface GroceryInputProps {
  onAdd: (name: string) => void;
}

export function GroceryInput({ onAdd }: GroceryInputProps) {
  const [value, setValue] = useState('');

  const trimmed = value.trim();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add item..."
        autoComplete="off"
        enterKeyHint="done"
        className="min-h-[44px] flex-1 rounded-lg bg-white/10 px-4 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-accent-gold"
      />
      <button
        type="submit"
        disabled={!trimmed}
        className="min-h-[44px] w-[44px] rounded-lg bg-accent-gold text-bg-primary font-bold disabled:opacity-30"
      >
        +
      </button>
    </form>
  );
}
