import { Suspense, lazy } from 'react';

// Dynamically import HelloRemote from the remote app
const HelloRemote = lazy(() => import('helloRemote/HelloRemote'));

export function RemoteComponent() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: '#666',
          }}
        >
          Loading remote component...
        </div>
      }
    >
      <HelloRemote />
    </Suspense>
  );
}

export default RemoteComponent;
