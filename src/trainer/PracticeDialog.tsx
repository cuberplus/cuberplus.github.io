import { useEffect, useId, useRef, useState } from 'react';
import { usePageDialog } from '@cuberplus/navigation';
import { cubeConnection } from '../../shared/cube/connection';
import { CubeConnectionMenu } from '../../shared/Components/CubeConnection';
import type { Cube } from '../../timer/src/Core/puzzle';
import { readBlitzSettings } from './blitz';
import { CasePractice } from './CasePractice';
import { caseKeyLabel } from '../database/caseLabels';
import { PageOptionsButton } from '../../shared/Components/PageOptionsButton';
import { BLITZ_SETTINGS_STORAGE } from './blitz';
import './trainer.css';

export function PracticeDialog({ cube, caseKey, close }: { cube: Cube; caseKey: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), title = useId();
  const [settings, setSettings] = useState(readBlitzSettings), [error, setError] = useState('');
  const options = useRef<HTMLDialogElement>(null);
  usePageDialog(dialog);
  useEffect(() => {
    cubeConnection.setPracticing(true);
    return () => cubeConnection.setPracticing(false);
  }, []);
  return <dialog ref={dialog} className="panel mistake-practice-dialog" aria-labelledby={title}
    onCancel={event => event.stopPropagation()} onClose={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="page-heading"><h2 id={title}>Practice {caseKeyLabel(caseKey)}</h2>
      <div className="page-actions"><CubeConnectionMenu /><PageOptionsButton open={() => options.current?.showModal()} /><button type="button" className="btn-close" aria-label="Close practice" autoFocus onClick={() => dialog.current?.close()} /></div>
    </div>
    <CasePractice cube={cube} mode="single" initialCase={caseKey} fixedCase settings={settings} optionsDialog={options} changeSettings={value => {
      setSettings(value);
      try { localStorage.setItem(BLITZ_SETTINGS_STORAGE, JSON.stringify(value)); setError(''); }
      catch { setError('Drill options changed, but could not be saved in this browser.'); }
    }} back={() => dialog.current?.close()} />
    {error && <p role="alert">{error}</p>}
  </dialog>;
}
