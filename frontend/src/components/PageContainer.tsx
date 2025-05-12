import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {children}
    </div>
  );
}
