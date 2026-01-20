export function App() {
  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-4">Auth MFE</h1>
        <p className="text-muted-foreground mb-8">
          Authentication microfrontend application - Standalone development mode
        </p>
        <p className="text-sm text-muted-foreground">
          This app exposes SignIn and SignUp components via Module Federation.
        </p>
      </div>
    </div>
  );
}

export default App;
