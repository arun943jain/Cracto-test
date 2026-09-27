import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_RELEASES } from './queries';
import ReleaseForm from './ReleaseForm';
import ReleaseCard from './ReleaseCard';

export default function App() {
  const { data, loading, error, refetch } = useQuery(GET_RELEASES);

  return (
    <div className="container">
      <header>
        <h1>Release Checklist</h1>
        <p className="muted">Track software releases through a fixed 8-step checklist.</p>
      </header>

      <ReleaseForm />

      <div className="toolbar">
        <h2>Releases</h2>
        <button className="ghost" onClick={() => refetch()}>Refresh</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="error">API error: {error.message}. Check VITE_API_URL.</p>}
      {data && data.releases.length === 0 && <p className="muted">No releases yet. Create one above.</p>}
      <div className="grid">
        {data?.releases.map((r) => <ReleaseCard key={r.id} release={r} />)}
      </div>
    </div>
  );
}
