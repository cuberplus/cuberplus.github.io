import { useContext, useEffect, useId, useRef } from 'react';
import { PageLocation, usePageDialog } from '@cuberplus/navigation';
import { InfoTip } from './InfoTip';

export function MacAddressHelp({ openFromAddress = false }: { openFromAddress?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), id = useId(), address = useContext(PageLocation);
  const visible = usePageDialog(dialog, false);
  useEffect(() => {
    if (visible && openFromAddress && new URLSearchParams((address || location.search).split('?').at(-1)).get('help') === 'mac-address') dialog.current?.showModal();
  }, [address, visible, openFromAddress]);
  return <>
    <button type="button" className="btn btn-link px-0 mt-2" onClick={() => dialog.current?.showModal()}>Find my cube&apos;s MAC address</button>
    <dialog ref={dialog} className="page-options-dialog mac-help-dialog" aria-labelledby={`${id}-title`}>
      <div className="page-heading"><h2 id={`${id}-title`}>Find your cube&apos;s Bluetooth MAC address <InfoTip>Try connecting with the MAC field empty first. Only enter an address if your cube asks for it. Use the cube&apos;s Bluetooth address, not your computer&apos;s adapter, Wi-Fi address, device name, or serial number. This help does not scan or upload addresses.</InfoTip></h2>
        <button ref={button => { if (button) button.autofocus = true; }} type="button" className="btn-close" aria-label="Close MAC address help" onClick={() => dialog.current?.close()} /></div>
      <p>Address format: <code>AA:BB:CC:DD:EE:FF</code></p>
      <h3 className="h5">Windows: Edge or Chrome</h3>
      <ol>
        <li>Wake the cube and disconnect it from other apps.</li>
        <li>In a new tab, paste <code>edge://bluetooth-internals/#devices</code> or <code>chrome://bluetooth-internals/#devices</code> into the address bar.</li>
        <li>Select <strong>Start Scan</strong>, find your cube by name, and copy its <strong>Address</strong>. Stop scanning without connecting from that page.</li>
        <li>Return here, paste the address into the Bluetooth MAC field, and connect to the same cube.</li>
      </ol>
      <h3 className="h5">Android</h3>
      <ol>
        <li>Open <a href="https://www.nordicsemi.com/Products/Development-tools/nRF-Connect-for-mobile" target="_blank" rel="noopener noreferrer">nRF Connect for Mobile</a> and grant Bluetooth scan permissions.</li>
        <li>Scan for the cube and copy the Bluetooth address beside its name. You do not need to connect.</li>
        <li>Stop scanning, then enter that address here and connect.</li>
      </ol>
      <h3 className="h5">iPhone, iPad, and Mac <InfoTip>iOS scanner apps cannot expose the hardware MAC; their UUID is not the address needed here. On macOS, Bluetooth-internals may also show an identifier that is not the real hardware MAC. Use Windows or Android, or consult the library author&apos;s FAQ.</InfoTip></h3>
      <a href="https://gist.github.com/afedotov/52057533a8b27a0277598160c384ae71" target="_blank" rel="noopener noreferrer">Cube library MAC-address FAQ</a>
    </dialog>
  </>;
}
