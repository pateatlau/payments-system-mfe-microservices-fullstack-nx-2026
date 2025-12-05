import { Route, Routes, Link } from 'react-router-dom';
import Layout from '../components/Layout';

export function App() {
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
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h2>Welcome to the Shell Application</h2>
              <p>This is the generated root route.</p>
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
