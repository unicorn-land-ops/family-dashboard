import { useState } from 'react';

export type MobileView = 'calendar' | 'groceries' | 'timers' | 'chores';

export function useMobileNav() {
  const [activeView, setActiveView] = useState<MobileView>('calendar');
  return { activeView, setActiveView };
}
