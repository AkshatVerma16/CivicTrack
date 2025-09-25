import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '512px', textAlign: 'center' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>CT</div>
          <h1 style={{ marginTop: '16px', fontSize: '30px', fontWeight: 'bold' }}>CivicTrack</h1>
          <p style={{ color: '#6b7280' }}>Report and track civic issues</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Link to="/report" style={{ borderRadius: '8px', backgroundColor: '#2563eb', padding: '12px 16px', color: 'white', fontWeight: '600', textDecoration: 'none' }}>Report an Issue</Link>
          <Link to="/track" style={{ borderRadius: '8px', backgroundColor: '#111827', padding: '12px 16px', color: 'white', fontWeight: '600', textDecoration: 'none' }}>Track Complaints</Link>
        </div>
      </div>
    </div>
  )
}






