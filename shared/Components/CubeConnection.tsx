import { useState } from 'react';
import { cubeConnection, useCubeConnection } from '../cube/connection';
import { InfoTip } from './InfoTip';

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
  const { cubes, connection, connecting, error } = useCubeConnection();
  const [name, setName] = useState(''), [mac, setMac] = useState('');
  return <section className="mb-4" aria-label="My cubes">
    <h3 className="h5">My cubes <InfoTip>Save a name and optional Bluetooth MAC for each cube. Choose a saved cube in Timer or Trainer before connecting. The browser may still ask you to select the Bluetooth device. One connection is shared across pages.</InfoTip></h3>
    {cubes.map(cube => <div key={cube.id} className="d-flex align-items-center gap-2 flex-wrap mb-2">
      <label>Cube name<input className="form-control" aria-label={`Name for ${cube.name}`} maxLength={100} value={cube.name}
        onChange={event => cubeConnection.save({ ...cube, name: event.target.value })} /></label>
      <label>Bluetooth MAC<input className="form-control" aria-label={`MAC for ${cube.name}`} placeholder="AA:BB:CC:DD:EE:FF" maxLength={17} value={cube.mac}
        onChange={event => cubeConnection.save({ ...cube, mac: event.target.value })} /></label>
      <button className="btn btn-outline-primary" disabled={connecting || !!connection || !navigator.bluetooth || !window.isSecureContext} onClick={() => {
        cubeConnection.select(cube.id); void cubeConnection.connect().catch(() => {});
      }}>Connect {cube.name}</button>
      <button className="btn btn-outline-danger" onClick={() => cubeConnection.forget(cube.id)}>Forget {cube.name}</button>
    </div>)}
    <form className="d-flex gap-2 align-items-end flex-wrap mt-3" onSubmit={event => {
      event.preventDefault(); cubeConnection.save({ id: crypto.randomUUID(), name: name.trim(), deviceName: '', mac: mac.trim() }); setName(''); setMac('');
    }}>
      <label>New cube name<input className="form-control" required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
      <label>MAC (if required)<input className="form-control" placeholder="AA:BB:CC:DD:EE:FF" pattern="([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}" value={mac} onChange={event => setMac(event.target.value)} /></label>
      <button className="btn btn-outline-primary" disabled={!name.trim()}>Save cube</button>
    </form>
    <div className="mt-3"><CubeConnectionControls /></div>
    {error && <p role="status" className="text-warning">{error}</p>}
  </section>;
}
