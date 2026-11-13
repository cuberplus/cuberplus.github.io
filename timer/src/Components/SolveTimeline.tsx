import { useEffect, useMemo, useRef, useState } from 'react';
import type { Solve } from '../Core/engine';
import type { Cube } from '../Core/puzzle';
import { analyzeCFOP, CFOP_STEPS, cfopTiming } from '../Analysis/cfop';
import { formatTime } from '../Data/storage';

// Analyzer's Cross/OLL/PLL hues, with the same dark purple for every F2L pair.
const colors = ['rgb(100, 200, 255)', 'rgb(156, 115, 220)', 'rgb(156, 115, 220)', 'rgb(156, 115, 220)', 'rgb(156, 115, 220)', 'rgb(255, 230, 150)', 'rgb(80, 220, 220)'];
type Annotation = { name: string; key: string; i: number; timing: ReturnType<typeof cfopTiming> | null; done: boolean };
export function SolveTimeline({ cube, solve, history, elapsed, precision, open, seek, seekMove, position, cursor, compact = false }: { cube: Cube; solve: Solve; history?: Solve[]; elapsed: number; precision: 2 | 3; open?: () => void; seek?: (time: number) => void; seekMove?: (position: number) => void; position?: number; cursor?: number; compact?: boolean }) {
  const trail = useRef<HTMLDivElement>(null), [width, setWidth] = useState(1000);
  useEffect(() => {
    if (!trail.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(trail.current); return () => observer.disconnect();
  }, []);
  const analysis = useMemo(() => solve.imported ? { ends: [] } : analyzeCFOP(solve, cube), [cube, solve, solve.startFacelets, solve.moves, solve.moves.length, solve.status, solve.crossOverride]), time = Math.round(Math.max(solve.duration, elapsed));
  const cfop = !solve.imported || solve.imported.method.startsWith('CFOP');
  const averages = useMemo(() => {
    if (!compact || solve.status === 'active' || !cfop) return [];
    const recent = (history ?? []).filter(item => item.id !== solve.id && item.createdAt <= solve.createdAt && item.status === 'complete' &&
      item.session !== 'Retries' && (!item.imported || item.imported.method.startsWith('CFOP'))).slice(0, 1000);
    const timings = recent.map(item => {
      const ends = item.imported ? [] : analyzeCFOP(item, cube).ends;
      return CFOP_STEPS.map((name, i) => item.imported ? item.imported.steps.find(step => step.name === name)?.time :
        i < ends.length ? cfopTiming(item, ends, i).time / 1000 : undefined);
    });
    return CFOP_STEPS.map((_, i) => {
      const values = timings.flatMap(row => row[i] !== undefined && Number.isFinite(row[i]) ? [row[i]!] : []);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
    });
  }, [cube, history, solve.id, solve.createdAt, solve.status, compact, cfop]);
  const steps = (cfop ? CFOP_STEPS : solve.imported!.steps.map(step => step.name)).map((name, i) => {
    const step = solve.imported?.steps.find(step => step.name === name);
    const start = solve.imported ? solve.imported.steps.slice(0, solve.imported.steps.findIndex(step => step.name === name)).reduce((sum, step) => sum + step.time * 1000, 0) : 0;
    return { name: name.replace('Slot', 'Pair'), i, timing: solve.imported ? step ? { start, end: start + step.time * 1000, time: step.time * 1000, recognition: step.recognitionTime * 1000, execution: step.executionTime * 1000 } : null : i <= analysis.ends.length ? cfopTiming(solve, analysis.ends, i, time) : null };
  });
  const scale = solve.status === 'active' ? Math.max(10000, time * 1.2) : Math.max(1, time);
  const segments = steps.flatMap(({ name, i, timing }) => timing ? [
    { name, i, phase: 'recognition', start: timing.start, end: timing.start + timing.recognition },
    { name, i, phase: 'execution', start: timing.start + timing.recognition, end: timing.end },
  ] : []).filter(segment => segment.end > segment.start);
  const pairs = steps.slice(1, 5).flatMap(step => step.timing ? [step.timing] : []);
  const f2l = pairs.length ? {
    start: pairs[0].start, end: pairs[pairs.length - 1].end,
    time: pairs.reduce((sum, pair) => sum + pair.time, 0),
    recognition: pairs.reduce((sum, pair) => sum + pair.recognition, 0),
    execution: pairs.reduce((sum, pair) => sum + pair.execution, 0),
  } : null;
  const annotation = (i: number): Annotation => ({ ...steps[i], key: String(i), done: !!solve.imported || i < analysis.ends.length });
  const major = cfop ? [annotation(0), { name: 'F2L', key: 'f2l', i: 1, timing: f2l, done: !!solve.imported || analysis.ends[4] !== undefined }, annotation(5), annotation(6)] : steps.map((_, i) => annotation(i));
  function annotations(items: Annotation[], bottom = false) {
    const captions = items.map(item => ({
      ...item, caption: bottom ? item.name.replace('Pair ', '') : item.name,
      text: item.timing ? `${formatTime(item.timing.time, precision)}s` : '--',
    }));
    const labelWidth = Math.max(64, ...captions.map(item => (item.caption.length + item.text.length + 1) * 7 + 12)), area = Math.max(width, labelWidth);
    const rows = Math.ceil(items.length / Math.max(1, Math.floor(area / (labelWidth + 8)))), height = rows * 24 + 12;
    const labels = captions.map((item, index) => ({
      ...item, row: index % rows, anchor: item.timing ? (item.timing.start + item.timing.end) / 2 / scale * area : (index + 0.5) / items.length * area, position: 0,
    }));
    // Spread crowded labels without changing the time positions their leaders point to.
    for (let row = 0; row < rows; row++) {
      const rowLabels = labels.filter(label => label.row === row); let edge = labelWidth / 2;
      for (const label of rowLabels) { label.position = Math.max(label.anchor, edge); edge = label.position + labelWidth + 8; }
      edge = area - labelWidth / 2;
      for (const label of [...rowLabels].reverse()) { label.position = Math.min(label.position, edge); edge = label.position - labelWidth - 8; }
    }
    return <div className={`trail-labels${bottom ? ' trail-labels-bottom' : ''}`} role="group" aria-label={bottom ? 'F2L sub-times' : 'CFOP steps'} style={{ height }}>
      <svg aria-hidden="true" viewBox={`0 0 ${area} ${height}`} preserveAspectRatio="none">
        {labels.filter(label => label.timing).map(({ key, i, row, anchor, position }) => <line key={key} x1={position} y1={bottom ? row * 24 + 12 : (row + 1) * 24} x2={anchor} y2={bottom ? 0 : height} stroke={colors[i]} />)}
      </svg>
      {labels.map(({ key, name, caption, i, timing, done, text, row, position }) => <span key={key} className="trail-duration" data-step={key} data-duration={timing?.time} data-status={!timing ? 'unreached' : done ? 'done' : 'pending'} role="img" aria-label={`${name}: ${text} (${!timing ? 'not reached' : done ? 'complete' : 'in progress'})`} title={timing ? `${name}: ${text}; ${formatTime(timing.recognition, precision)}s recognition / ${formatTime(timing.execution, precision)}s execution` : `${name}: not reached`} style={{ left: `${position / area * 100}%`, top: row * 24 + (bottom ? 12 : 0), width: labelWidth, [bottom ? 'borderTopColor' : 'borderBottomColor']: colors[i] }}><strong>{caption}</strong> {text}</span>)}
    </div>;
  }
  return <div className={`mt-3 mb-3${compact ? ' timer-timeline' : ''}`} role={open ? 'button' : 'group'} aria-label={open ? 'View most recent solve' : 'Solve timeline'} tabIndex={open ? 0 : undefined} onClick={open} onKeyDown={event => { if (open && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); open(); } }} style={open ? { cursor: 'pointer' } : undefined}>
    {annotations(major)}
    <div className="solve-trail" ref={trail} role={seek ? 'slider' : undefined} tabIndex={seek ? 0 : undefined}
      aria-label={seek ? 'Replay move' : undefined} aria-valuemin={seek ? 0 : undefined} aria-valuemax={seek ? solve.moves.length : undefined} aria-valuenow={seek ? position : undefined}
      onClick={event => { if (seek) { const rect = event.currentTarget.getBoundingClientRect(); seek(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * scale); } }}
      onKeyDown={event => { if (!seek) return; const next = event.key === 'ArrowRight' ? (position ?? 0) + 1 : event.key === 'ArrowLeft' ? (position ?? 0) - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? solve.moves.length : null; if (next !== null) { event.preventDefault(); if (seekMove) seekMove(Math.max(0, Math.min(next, solve.moves.length))); else seek(next <= 0 ? -1 : solve.moves[Math.min(next, solve.moves.length) - 1].elapsed); } }}>
      {segments.map(({ name, i, phase, start, end }) => <span key={`${i}-${phase}`} className={`trail-segment ${phase}`} data-step={i} data-phase={phase} data-start={start} data-end={end} role="img" aria-label={`${name} ${phase}: ${formatTime(end - start, precision)}s`} title={`${name} ${phase}: ${formatTime(end - start, precision)}s`} style={{ left: `${start / scale * 100}%`, width: `${(end - start) / scale * 100}%`, backgroundColor: colors[i] }} />)}
      {solve.status === 'active' && <span className="trail-tip" aria-hidden="true" style={{ left: `${time / scale * 100}%` }} />}
      {seek && <span className="trail-tip" aria-hidden="true" style={{ left: `${(cursor ?? (position ? solve.moves[position - 1].elapsed : 0)) / scale * 100}%` }} />}
    </div>
    {cfop && annotations([1, 2, 3, 4].map(annotation), true)}
    <div className="trail-axis d-flex justify-content-between small text-secondary"><span>0s</span><span>{formatTime(scale, precision)}s</span></div>
    {compact && <div className="trail-compact">{steps.map(({ name, i, timing }) => {
      const average = averages[i], difference = timing && average !== undefined ? Number((timing.time / 1000).toFixed(precision)) - Number(average.toFixed(precision)) : null;
      const comparison = difference === null ? '' : difference < 0 ? 'faster' : difference > 0 ? 'slower' : 'equal';
      return <span key={i} className={comparison ? `split-${comparison}` : undefined} data-comparison={comparison || undefined}
        aria-label={`${name}: ${timing ? formatTime(timing.time, precision) + 's' : 'not reached'}${comparison ? `, ${comparison} compared with recent 1000 average of ${average!.toFixed(precision)}s` : ''}`}>
        {name.replace('F2L Pair ', 'F2L ')}<strong>{timing ? formatTime(timing.time, precision) : '--'}</strong></span>;
    })}</div>}
  </div>;
}
