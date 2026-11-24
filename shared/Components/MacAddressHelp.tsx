import { useContext, useEffect, useId, useRef, useState } from 'react';
import { PageLocation, usePageDialog } from '@cuberplus/navigation';
import { InfoTip } from './InfoTip';
import { TOOLTIPS } from '../tooltips';

export function MacAddressHelp({ openFromAddress = false }: { openFromAddress?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), id = useId(), address = useContext(PageLocation);
  const visible = usePageDialog(dialog, false);
  useEffect(() => {
    if (visible && openFromAddress && new URLSearchParams((address || location.search).split('?').at(-1)).get('help') === 'mac-address') dialog.current?.showModal();
  }, [address, visible, openFromAddress]);
  return <>
    <button type="button" className="btn btn-link px-0 mt-2" onClick={() => dialog.current?.showModal()}>Find my cube&apos;s MAC address</button>
    <dialog ref={dialog} className="page-options-dialog mac-help-dialog" aria-labelledby={`${id}-title`}>
      <div className="page-heading"><h2 id={`${id}-title`}>Find your cube&apos;s Bluetooth MAC address <InfoTip>{TOOLTIPS.macAddressHelp.overview}</InfoTip></h2>
        <button ref={button => { if (button) button.autofocus = true; }} type="button" className="btn-close" aria-label="Close MAC address help" onClick={() => dialog.current?.close()} /></div>
      <p>Address format: <code>AA:BB:CC:DD:EE:FF</code></p>
      <h3 className="h5">Windows: Edge or Chrome <InfoTip>{TOOLTIPS.macAddressHelp.browserPages}</InfoTip></h3>
      <ol>
        <li>Wake the cube and disconnect it from other apps.</li>
        <li>Copy the address for your browser, then paste it into a new tab&apos;s address bar:
          <BrowserAddress browser="Edge" />
          <BrowserAddress browser="Chrome" />
        </li>
        <li>Select <strong>Start Scan</strong>, find your cube by name, and copy its <strong>Address</strong>. Stop scanning without connecting from that page.</li>
        <li>Return here, paste the address into the Bluetooth MAC field, and connect to the same cube.</li>
      </ol>
      <h3 className="h5">Android</h3>
      <ol>
        <li>Open <a href="https://www.nordicsemi.com/Products/Development-tools/nRF-Connect-for-mobile" target="_blank" rel="noopener noreferrer">nRF Connect for Mobile</a> and grant Bluetooth scan permissions.</li>
        <li>Scan for the cube and copy the Bluetooth address beside its name. You do not need to connect.</li>
        <li>Stop scanning, then enter that address here and connect.</li>
      </ol>
      <h3 className="h5">iPhone, iPad, and Mac <InfoTip>{TOOLTIPS.macAddressHelp.platformLimitations}</InfoTip></h3>
      <a href="https://gist.github.com/afedotov/52057533a8b27a0277598160c384ae71" target="_blank" rel="noopener noreferrer">Cube library MAC-address FAQ</a>
    </dialog>
  </>;
}

function BrowserAddress({ browser }: { browser: 'Edge' | 'Chrome' }) {
  const id = useId(), code = useRef<HTMLElement>(null), timer = useRef<ReturnType<typeof setTimeout>>(), lastMessage = useRef('');
  const [status, setStatus] = useState('');
  const address = `${browser.toLowerCase()}://bluetooth-internals/#devices`;
  async function copy() {
    clearTimeout(timer.current);
    let message: string;
    try { await navigator.clipboard.writeText(address); message = `${browser} address copied.`; }
    catch { message = 'Could not copy. Select the address above and copy it manually.'; }
    if (message === lastMessage.current) message += '\u00a0';
    lastMessage.current = message;
    setStatus(message);
    timer.current = setTimeout(() => setStatus(''), 3000);
  }
  useEffect(() => {
    const target = code.current;
    const onCommand = (event: Event) => { if ((event as Event & { command: string }).command === '--copy') void copy(); };
    target?.addEventListener('command', onCommand);
    return () => { target?.removeEventListener('command', onCommand); clearTimeout(timer.current); };
  }, [address]);
  return <div className="d-flex align-items-center gap-2 flex-wrap my-2">
    <code ref={code} id={id} className="text-break">{address}</code>
    <button type="button" className="btn btn-sm btn-outline-secondary" {...{ command: '--copy', commandfor: id }}
      onClick={() => { if (!('CommandEvent' in window)) void copy(); }}>Copy {browser} address</button>
    <span role="status" className="small">{status}</span>
  </div>;
}
