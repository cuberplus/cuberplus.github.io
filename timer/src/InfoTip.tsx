import { useId, useRef } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export function InfoTip({ children, id }: { children: string; id?: string }) {
  const generatedId = useId(), container = useRef<HTMLSpanElement>(null);
  return <span ref={container} className="ms-2">
    <OverlayTrigger trigger={['hover', 'focus']} placement="top" container={container}
      overlay={<Tooltip id={id ?? generatedId}>{children}</Tooltip>}>
      <button type="button" className="btn btn-link btn-sm p-0 border-0 text-secondary text-decoration-none"
        aria-label={children}>&#9432;</button>
    </OverlayTrigger>
  </span>;
}
