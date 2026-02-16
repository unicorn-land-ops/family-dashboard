import type { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="dashboard-grid h-dvh w-screen overflow-hidden p-[clamp(12px,1.5vw,24px)] gap-[clamp(10px,1vw,20px)]">
      {children}
    </div>
  );
}
