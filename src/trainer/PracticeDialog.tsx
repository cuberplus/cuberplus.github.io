import { useEffect, useId, useRef, useState } from 'react';
import { usePageDialog } from '@cuberplus/navigation';
import { cubeConnection } from '../../shared/cube/connection';
import { CubeConnectionMenu } from '../../shared/Components/CubeConnection';
import type { Cube } from '../../timer/src/Core/puzzle';
import { readBlitzSettings } from './blitz';
import { CasePractice } from './CasePractice';
import './trainer.css';

export function PracticeDialog({ cube, caseKey, close }: { cube: Cube; caseKey: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), title = useId();
  const [settings] = useState(readBlitzSettings);
  usePageDialog(dialog);
  useEffect(() => {
    cubeConnection.setPracticing(true);
    return () => cubeConnection.setPracticing(false);
  }, []);
  return <dialog ref={dialog} className="panel mistake-practice-dialog" aria-labelledby={title}
    onCancel={event => event.stopPropagation()} onClose={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="page-heading"><h2 id={title}>Practice {caseKey.replace('-', ' ')}</h2>
      <div className="page-actions"><CubeConnectionMenu /><button type="button" className="btn-close" aria-label="Close practice" autoFocus onClick={() => dialog.current?.close()} /></div>
    </div>
    <CasePractice cube={cube} mode="single" initialCase={caseKey} fixedCase settings={settings} back={() => dialog.current?.close()} />
  </dialog>;
}
