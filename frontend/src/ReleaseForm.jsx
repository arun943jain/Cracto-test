import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_RELEASE, GET_RELEASES } from './queries';

export default function ReleaseForm() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [error, setError] = useState('');
  const [createRelease, { loading }] = useMutation(CREATE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
  });

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!date) { setError('Due date is required.'); return; }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) { setError('Due date is invalid.'); return; }
    try {
      await createRelease({ variables: { name: name.trim(), date: parsed.toISOString(), additionalInfo: additionalInfo || null } });
      setName(''); setDate(''); setAdditionalInfo('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>New release</h2>
      <label>Name*<input value={name} onChange={(e) => setName(e.target.value)} placeholder="v1.2.0" maxLength={200} /></label>
      <label>Due date*<input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label>Additional info<textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Optional notes…" rows={3} /></label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create release'}</button>
    </form>
  );
}
