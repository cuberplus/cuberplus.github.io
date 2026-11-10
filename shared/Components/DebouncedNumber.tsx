import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { FormControl } from 'react-bootstrap';

export function DebouncedNumber({ value, onChange, disabled, ...props }: ComponentProps<typeof FormControl>) {
  const [draft, setDraft] = useState(value);
  const pending = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(pending.current); setDraft(value);
    return () => clearTimeout(pending.current);
  }, [value, disabled]);
  return <FormControl {...props} type="number" disabled={disabled} value={draft} onChange={event => {
    setDraft(event.target.value); clearTimeout(pending.current);
    if (event.target.value.trim() && Number.isFinite(Number(event.target.value))) {
      pending.current = setTimeout(() => onChange?.(event), 450);
    }
  }} />;
}
