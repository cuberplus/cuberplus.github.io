import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Overlay, Tooltip } from 'react-bootstrap';
import { PageVisible } from '../navigation';

export function InfoTip({ children, id }: { children: string; id?: string }) {
  const generatedId = useId(), trigger = useRef<HTMLButtonElement>(null), pending = useRef<ReturnType<typeof setTimeout>>();
  const [open, setOpen] = useState(false), visible = useContext(PageVisible);
  const hide = () => { clearTimeout(pending.current); setOpen(false); };
  const show = () => { clearTimeout(pending.current); setOpen(true); };
  const leave = () => { clearTimeout(pending.current); pending.current = setTimeout(() => setOpen(false), 150); };
  useEffect(() => { if (!visible) setOpen(false); return () => clearTimeout(pending.current); }, [visible]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { clearTimeout(pending.current); setOpen(false); event.preventDefault(); event.stopPropagation(); } };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [open]);
  return <span className="ms-2">
    <button ref={trigger} type="button" className="btn btn-link btn-sm p-0 border-0 text-secondary text-decoration-none info-tip"
      aria-label={children} aria-describedby={open && visible ? id ?? generatedId : undefined}
      onMouseEnter={show} onMouseLeave={leave} onFocus={show} onBlur={leave} onClick={show}>&#9432;</button>
    <Overlay target={trigger.current} show={open && visible} rootClose onHide={hide} placement="top"
      container={() => trigger.current?.closest('dialog') ?? document.body} popperConfig={{ strategy: 'fixed' }}>
      {props => <Tooltip {...props} id={id ?? generatedId} onMouseEnter={show} onMouseLeave={leave}>{children}</Tooltip>}
    </Overlay>
  </span>;
}
