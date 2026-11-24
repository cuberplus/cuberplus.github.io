import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Overlay, Tooltip } from 'react-bootstrap';
import { PageVisible } from '../navigation';

export function InfoTip({ children, id, icon = '\u24d8' }: { children: string; id?: string; icon?: string }) {
  const generatedId = useId(), trigger = useRef<HTMLButtonElement>(null), content = useRef<HTMLDivElement>(null), pending = useRef<ReturnType<typeof setTimeout>>();
  const topLayer = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype && typeof HTMLElement.prototype.showPopover === 'function';
  const [open, setOpen] = useState(false), visible = useContext(PageVisible);
  const hide = () => { clearTimeout(pending.current); setOpen(false); };
  const show = () => { clearTimeout(pending.current); setOpen(true); };
  const leave = () => { clearTimeout(pending.current); pending.current = setTimeout(() => {
    if (document.activeElement !== trigger.current && !content.current?.contains(document.activeElement)) setOpen(false);
  }, 150); };
  useEffect(() => { if (!visible) setOpen(false); return () => clearTimeout(pending.current); }, [visible]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { clearTimeout(pending.current); setOpen(false); event.preventDefault(); event.stopPropagation(); } };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [open]);
  return <span className="ms-2">
    <button ref={trigger} type="button" className="btn btn-link btn-sm p-0 border-0 text-secondary text-decoration-none info-tip"
      aria-label={children} aria-expanded={open && visible} aria-describedby={open && visible ? id ?? generatedId : undefined}
      onKeyDown={event => { if (open && event.key === 'ArrowDown') { event.preventDefault(); content.current?.focus(); } }}
      onMouseEnter={show} onMouseLeave={leave} onFocus={show} onBlur={leave} onClick={show}>{icon}</button>
    <Overlay target={trigger.current} show={open && visible} rootClose flip onHide={hide} placement="top"
      container={() => trigger.current?.closest('dialog') ?? document.body} popperConfig={{ strategy: 'fixed', modifiers: [
        { name: 'flip', options: { boundary: [], rootBoundary: 'viewport', padding: 8, fallbackPlacements: ['bottom', 'right', 'left'] } },
        { name: 'preventOverflow', options: { boundary: [], rootBoundary: 'viewport', padding: 8, altAxis: true, tether: false } },
      ] }}>
      {props => <Tooltip {...props} {...{ popover: topLayer ? 'manual' : undefined }} className="info-tooltip" id={id ?? generatedId}
        ref={element => {
          props.ref(element);
          if (!element) return;
          const zoom = Number.parseFloat(getComputedStyle(document.body).zoom) || 1, box = trigger.current!.getBoundingClientRect();
          element.style.setProperty('--info-tooltip-zoom', String(zoom));
          element.style.setProperty('--info-tooltip-space', `${Math.max(24, Math.max(box.top, innerHeight - box.bottom) - 24)}px`);
          if (typeof element.showPopover === 'function' && !element.matches(':popover-open')) element.showPopover();
        }} onMouseEnter={show} onMouseLeave={leave} onFocus={show} onBlur={leave}>
        <div ref={content} className="info-tooltip-content" tabIndex={0}>{children}</div>
      </Tooltip>}
    </Overlay>
  </span>;
}
