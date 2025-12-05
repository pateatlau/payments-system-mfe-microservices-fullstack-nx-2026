export default function HelloRemote() {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: '#e8f4f8',
        border: '2px solid #0066cc',
        borderRadius: '8px',
        margin: '1rem 0',
      }}
    >
      <h2 style={{ margin: '0 0 0.5rem 0', color: '#0066cc' }}>
        Hello from Remote!
      </h2>
      <p style={{ margin: 0, color: '#333' }}>
        This component is loaded dynamically via Module Federation.
      </p>
    </div>
  );
}
