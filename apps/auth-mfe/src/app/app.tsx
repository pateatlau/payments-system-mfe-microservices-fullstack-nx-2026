// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import NxWelcome from './nx-welcome';

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Auth MFE</h1>
        <p className="text-slate-600 mb-8">
          Authentication microfrontend application
        </p>
        <NxWelcome title="auth-mfe" />
      </div>
    </div>
  );
}

export default App;
