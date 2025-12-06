import { ReactNode } from 'react';
import { Header } from 'shared-header-ui';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8 bg-slate-50">
        {children}
      </main>
    </div>
  );
}

export default Layout;
