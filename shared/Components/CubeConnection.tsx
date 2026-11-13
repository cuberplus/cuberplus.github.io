import { useEffect, useRef, useState } from 'react';
import { usePageDialog } from '@cuberplus/navigation';
import { cubeConnection, useCubeConnection } from '../cube/connection';
import { InfoTip } from './InfoTip';
import { MacAddressHelp } from './MacAddressHelp';

export function CubeButton({ connected, open }: { connected: boolean; open: () => void }) {
  const { cubes, selected, connection } = useCubeConnection();
  const saved = connection ? cubes.find(cube => connection.deviceMAC ? cube.mac.toLowerCase() === connection.deviceMAC.toLowerCase() : cube.deviceName === connection.deviceName) : cubes.find(cube => cube.id === selected);
  const name = saved?.name || connection?.deviceName || 'Cube';
  return <button type="button" className={`btn btn-outline-secondary cube-setup-button${connected ? ' is-connected' : ''}`} aria-label="Bluetooth cube setup" onClick={open}><span aria-hidden="true">&#9679;</span> {name}</button>;
}
export function CubeConnectionMenu() {
  const dialog = useRef<HTMLDialogElement>(null), { connection } = useCubeConnection();
  usePageDialog(dialog, false);
  useEffect(() => { if (connection) dialog.current?.close(); }, [connection]);
  return <><CubeButton connected={!!connection} open={() => dialog.current?.showModal()} />
    <dialog ref={dialog} className="page-options-dialog" aria-labelledby="trainer-cube-title">
      <div className="page-heading"><h2 id="trainer-cube-title">Bluetooth cube setup <InfoTip>Choose a saved cube or connect another device. Manage saved cubes and Bluetooth addresses in the site Options. Bluetooth requires HTTPS and a supported browser, such as Chrome or Edge.</InfoTip></h2><button ref={button => { if (button) button.autofocus = true; }} type="button" className="btn-close" aria-label="Close cube setup" onClick={() => dialog.current?.close()} /></div>
      <CubeConnectionControls />
      <MacAddressHelp />
      {(!navigator.bluetooth || !window.isSecureContext) && <p className="mt-3 mb-0">Bluetooth needs a supported browser and HTTPS or localhost.</p>}
    </dialog></>;
}
export function CubePicker({ disabled = false, change }: { disabled?: boolean; change?: (mac: string) => void }) {
  const { cubes, selected } = useCubeConnection();
  return cubes.length ? <select aria-label="My cube" className="form-select w-auto" disabled={disabled} value={selected} onChange={event => {
    cubeConnection.select(event.target.value); change?.(cubes.find(cube => cube.id === event.target.value)?.mac ?? '');
  }}>
    <option value="">Another cube</option>{cubes.map(cube => <option key={cube.id} value={cube.id}>{cube.name}</option>)}
  </select> : null;
}
export function CubeConnectionControls() {
  const { connection, connecting, battery, error } = useCubeConnection();
  return <div className="cuberplus-header-controls">
    <CubePicker disabled={!!connection || connecting} />
    {connection ? <button className="btn btn-outline-secondary" title={`Connected: ${connection.deviceName}`} onClick={() => void cubeConnection.disconnect().catch(() => {})}>Disconnect</button> :
      <button className="btn btn-primary" disabled={connecting || !navigator.bluetooth || !window.isSecureContext}
        onClick={() => void cubeConnection.connect().catch(() => {})}>{connecting ? 'Connecting...' : 'Connect cube'}</button>}
    {battery !== null && <span className="badge text-bg-secondary">{battery}% battery</span>}
    {error && <span role="alert" className="text-danger small">{error}</span>}
  </div>;
}
export function MyCubes() {
  const { cubes, connection, connecting } = useCubeConnection();
  const [name, setName] = useState(''), [mac, setMac] = useState('');
  return <section className="settings-section" aria-label="My cubes">
    <h3>Connect cube <InfoTip>One Bluetooth connection is shared across pages. Choose a saved cube or connect another device. Expand a saved cube to edit its name or optional Bluetooth MAC. The browser may still ask you to select the device. Bluetooth requires a secure connection and a supported browser, such as Chrome or Edge.</InfoTip></h3>
    <div className="settings-status">
      <span className="backup-status" role="status">{connection ? `Connected to ${connection.deviceName}` : connecting ? 'Connecting...' : !navigator.bluetooth || !window.isSecureContext ? 'Bluetooth unavailable in this browser' : 'No cube connected'}</span>
      <CubeConnectionControls />
    </div>
    <MacAddressHelp openFromAddress />
    {!!cubes.length && <h4 className="h6 mt-4">Saved cubes</h4>}
    {cubes.map(cube => <details key={cube.id} className="saved-cube">
      <summary>{cube.name}</summary>
      <div className="settings-fields">
      <label>Cube name<input className="form-control" aria-label={`Name for ${cube.name}`} maxLength={100} value={cube.name}
        onChange={event => cubeConnection.save({ ...cube, name: event.target.value })} /></label>
      <label>Bluetooth MAC<input className="form-control" aria-label={`MAC for ${cube.name}`} placeholder="AA:BB:CC:DD:EE:FF" maxLength={17} value={cube.mac}
        onChange={event => cubeConnection.save({ ...cube, mac: event.target.value })} /></label>
      <button className="btn btn-outline-primary" disabled={connecting || !!connection || !navigator.bluetooth || !window.isSecureContext} onClick={() => {
        cubeConnection.select(cube.id); void cubeConnection.connect().catch(() => {});
      }}>Connect {cube.name}</button>
      <button className="btn btn-outline-danger" onClick={() => cubeConnection.forget(cube.id)}>Forget {cube.name}</button>
      </div>
    </details>)}
    <details className="settings-disclosure"><summary>Add a cube</summary>
    <form className="settings-fields" onSubmit={event => {
      event.preventDefault(); cubeConnection.save({ id: crypto.randomUUID(), name: name.trim(), deviceName: '', mac: mac.trim() }); setName(''); setMac('');
    }}>
      <label>New cube name<input className="form-control" required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
      <label>MAC (if required)<input className="form-control" placeholder="AA:BB:CC:DD:EE:FF" pattern="([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}" value={mac} onChange={event => setMac(event.target.value)} /></label>
      <button className="btn btn-outline-primary" disabled={!name.trim()}>Save cube</button>
    </form>
    </details>
  </section>;
}
