import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps): JSX.Element {
  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <header
        style={{
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          padding: '1rem 2rem',
          borderBottom: '1px solid #333',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
          Payments System - Shell
        </h1>
      </header>
      <main
        style={{
          flex: 1,
          padding: '2rem',
          backgroundColor: '#f5f5f5',
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default Layout;
