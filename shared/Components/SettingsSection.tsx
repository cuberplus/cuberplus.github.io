import { useId, useState, type ReactNode } from 'react';

export function SettingsSection({ title, help, children, id, className = '' }: {
  title: string; help?: ReactNode; children: ReactNode; id?: string; className?: string;
}) {
  const [open, setOpen] = useState(false), contentId = useId();
  return <section className={`settings-section ${className}`} aria-labelledby={id ?? `${contentId}-heading`}>
    <h2 id={id ?? `${contentId}-heading`} className="settings-heading">
      <button type="button" className="btn btn-link settings-toggle" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(!open)}>
        <span aria-hidden="true">{open ? '\u25be' : '\u25b8'}</span> {title}
      </button>{help}
    </h2>
    <div id={contentId} className="settings-section-content" hidden={!open}>{children}</div>
  </section>;
}
