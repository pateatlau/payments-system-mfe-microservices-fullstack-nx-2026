import { Route, Routes, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import RemoteComponent from '../components/RemoteComponent';
import { formatDate } from 'shared-utils';
import { Button } from 'shared-ui';
import type { User } from 'shared-types';

export function App() {
  // Example usage of shared-types
  const exampleUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
  };

  return (
    <Layout>
      <div role="navigation">
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            gap: '1rem',
          }}
        >
          <li>
            <Link to="/" style={{ textDecoration: 'none', color: '#0066cc' }}>
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/page-2"
              style={{ textDecoration: 'none', color: '#0066cc' }}
            >
              Page 2
            </Link>
          </li>
        </ul>
      </div>
      <RemoteComponent />
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h2 className="text-2xl font-bold">
                Welcome to the Shell Application
              </h2>
              <p>This is the generated root route.</p>
              <p>Current date: {formatDate(new Date())}</p>
              <p>
                Example user: {exampleUser.name} ({exampleUser.email})
              </p>
              <div
                style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}
              >
                <Button onClick={() => alert('Primary button clicked!')}>
                  Primary Button
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => alert('Secondary button clicked!')}
                >
                  Secondary Button
                </Button>
              </div>
              <Link to="/page-2" style={{ color: '#0066cc' }}>
                Click here for page 2.
              </Link>
            </div>
          }
        />
        <Route
          path="/page-2"
          element={
            <div>
              <h2>Page 2</h2>
              <Link to="/" style={{ color: '#0066cc' }}>
                Click here to go back to root page.
              </Link>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
