import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { STEPS } from './steps';
import { TOGGLE_STEP, DELETE_RELEASE, UPDATE_RELEASE, GET_RELEASES } from './queries';

export default function ReleaseCard({ release }) {
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState(release.additionalInfo || '');
  const [cardError, setCardError] = useState('');
  const [pendingStep, setPendingStep] = useState(null);
  const [toggleStep] = useMutation(TOGGLE_STEP, { refetchQueries: [{ query: GET_RELEASES }] });
  const [deleteRelease, { loading: deleting }] = useMutation(DELETE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
  });
  const [updateRelease, { loading: saving }] = useMutation(UPDATE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
  });

  const done = release.completedSteps.length;
  const total = STEPS.length;
  const pct = Math.round((done / total) * 100);

  async function onToggle(i, checked) {
    setCardError('');
    setPendingStep(i);
    try {
      await toggleStep({ variables: { id: release.id, stepIndex: i, completed: checked } });
    } catch (e) {
      setCardError(e.message);
    } finally {
      setPendingStep(null);
    }
  }

  async function onSaveInfo() {
    setCardError('');
    try {
      await updateRelease({ variables: { id: release.id, additionalInfo: info || null } });
      setEditing(false);
    } catch (e) {
      setCardError(e.message);
    }
  }

  async function onDelete() {
    if (!confirm('Are you sure you want to delete this release?')) return;
    setCardError('');
    try {
      await deleteRelease({ variables: { id: release.id } });
    } catch (e) {
      setCardError(e.message);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>{release.name}</strong>
          <div className="muted">Due: {new Date(release.date).toLocaleString()}</div>
        </div>
        <span className={`badge ${release.status}`}>{release.status}</span>
      </div>

      <div className="progress-wrap">
        <div className="progress-meta">
          <span>{done}/{total} completed</span>
          <span>{pct}%</span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="steps">
        {STEPS.map((label, i) => {
          const checked = release.completedSteps.includes(i);
          return (
            <li key={i} className={checked ? 'step-done' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={pendingStep === i}
                  onChange={(e) => onToggle(i, e.target.checked)}
                />
                <span className="step-label">{i + 1}. {label}</span>
              </label>
            </li>
          );
        })}
      </ul>

      {cardError && <p className="error">{cardError}</p>}

      <div className="info">
        <h4>Additional information</h4>
        {editing ? (
          <>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={3}
              placeholder="Optional notes…"
              disabled={saving}
            />
            <div className="row">
              <button onClick={onSaveInfo} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button
                className="ghost"
                disabled={saving}
                onClick={() => { setEditing(false); setInfo(release.additionalInfo || ''); setCardError(''); }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p>{release.additionalInfo || <span className="muted">No additional info.</span>}</p>
            <div className="row">
              <button className="ghost" onClick={() => setEditing(true)}>Edit info</button>
              <button className="danger" onClick={onDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
