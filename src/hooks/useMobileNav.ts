import { useState } from 'react';

export type MobileView = 'calendar' | 'groceries' | 'chores' | 'events';

export function useMobileNav() {
  const [activeView, setActiveView] = useState<MobileView>('calendar');
  return { activeView, setActiveView };
}
