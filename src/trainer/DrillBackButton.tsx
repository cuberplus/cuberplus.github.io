export function DrillBackButton({ back, label = 'Back to drills', disabled = false }: { back: () => void; label?: string; disabled?: boolean }) {
  return <button type="button" className="btn btn-outline-secondary trainer-back" aria-label={label} disabled={disabled} onClick={back}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7" /></svg>
  </button>;
}
