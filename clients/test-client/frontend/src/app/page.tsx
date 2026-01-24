export default function Home() {
  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Test Client</h1>
      <p>This is a simple test client for development and integration testing.</p>
      <p>If you can see this page, the client integration is working! 🎉</p>
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Status</h2>
        <p>✅ Frontend: Running</p>
        <p>✅ Backend: Check <a href="/api/hello">/api/hello</a></p>
      </div>
    </main>
  );
}
