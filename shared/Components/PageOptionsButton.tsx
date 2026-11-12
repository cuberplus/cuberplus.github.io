export function PageOptionsButton({ open }: { open: () => void }) {
  return <button type="button" className="btn btn-outline-secondary page-options-button" aria-label="Options" onClick={open}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 2h4l.5 3 2 1.2 2.85-1.05 2 3.46L19 10.5v3l2.35 1.89-2 3.46-2.85-1.05-2 1.2-.5 3h-4l-.5-3-2-1.2-2.85 1.05-2-3.46L5 13.5v-3L2.65 8.61l2-3.46L7.5 6.2l2-1.2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg><span>Options</span>
  </button>;
}
