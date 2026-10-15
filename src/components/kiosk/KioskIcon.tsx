// One stroke icon set for the kiosk (1.8 stroke, round caps). Static markup only.
const PATHS = {
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  train: '<path d="M8 3h8a4 4 0 0 1 4 4v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a4 4 0 0 1 4-4zM4 11h16M8 15h.01M16 15h.01M8 21l2-3M16 21l-2-3"/>',
  backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5M8 10h8"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  timer: '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  shirt: '<path d="M20.4 6.6 16 4a4 4 0 0 1-8 0L3.6 6.6a1 1 0 0 0-.6 1.1l.6 3.5a1 1 0 0 0 1 .8H6v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8h1.4a1 1 0 0 0 1-.8l.6-3.5a1 1 0 0 0-.6-1.1z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM20 17v5H6.5A2.5 2.5 0 0 1 4 19.5"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function KioskIcon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`kd-ico ${className}`} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: PATHS[name] }} />;
}

/** Picture for one of Ellis's chores, matched on its title. */
export function choreIcon(title: string): IconName {
  const t = title.toLowerCase();
  if (/bett|bed/.test(t)) return 'bed';
  if (/ranzen|schul|backpack|bag/.test(t)) return 'backpack';
  if (/anzieh|kleid|dress|cloth/.test(t)) return 'shirt';
  if (/les|buch|book|read/.test(t)) return 'book';
  return 'star';
}
