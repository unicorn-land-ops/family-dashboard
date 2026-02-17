import { useState } from 'react';

export type MobileView = 'calendar' | 'groceries' | 'chores';

export function useMobileNav() {
  const [activeView, setActiveView] = useState<MobileView>('calendar');
  return { activeView, setActiveView };
}
