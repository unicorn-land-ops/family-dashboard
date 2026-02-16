import { useState, type FormEvent } from 'react';

interface TimerInputProps {
  onAdd: (label: string, durationSeconds: number) => void;
}

const PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
] as const;

export function TimerInput({ onAdd }: TimerInputProps) {
  const [label, setLabel] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');

  function getLabel(): string {
    return label.trim() || 'Timer';
  }

  function handlePreset(seconds: number) {
    onAdd(getLabel(), seconds);
    setLabel('');
  }

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    const mins = Number(customMinutes);
    if (!mins || mins < 1) return;
    onAdd(getLabel(), mins * 60);
    setLabel('');
    setCustomMinutes('');
  }

  return (
    <div className="p-3 space-y-3">
      {/* Label input */}
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Timer label..."
        autoComplete="off"
        className="min-h-[44px] w-full rounded-lg bg-white/10 px-4 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-accent-gold"
      />

      {/* Preset duration buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.seconds}
            type="button"
            onClick={() => handlePreset(p.seconds)}
            className="card-glass min-h-[44px] px-4 py-2 text-sm font-medium text-white/80 hover:bg-accent-gold/20 hover:text-accent-gold active:bg-accent-gold/30 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom duration */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="number"
          min={1}
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          placeholder="min"
          className="min-h-[44px] w-20 rounded-lg bg-white/10 px-4 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-accent-gold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="submit"
          disabled={!customMinutes || Number(customMinutes) < 1}
          className="min-h-[44px] rounded-lg bg-accent-gold px-6 text-bg-primary font-bold disabled:opacity-30 transition-opacity"
        >
          Start
        </button>
      </form>
    </div>
  );
}
