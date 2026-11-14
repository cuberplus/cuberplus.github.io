import { useSyncExternalStore } from 'react';
import type { SmartCubeConnection, SmartCubeEvent } from 'smartcube-web-bluetooth';
import { BluetoothCube } from '../../timer/src/Bluetooth/bluetooth';

export type CubeEvent = SmartCubeEvent | { type: 'CALIBRATE'; stage: 'start' | 'complete' };
export interface SavedCube { id: string; name: string; deviceName: string; mac: string }
const CUBES_KEY = 'cuberplus-my-cubes-v1';
const SELECTED_KEY = 'cuberplus-selected-cube';
function readCubes(): SavedCube[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CUBES_KEY) ?? '[]') as SavedCube[];
    return Array.isArray(saved) ? saved.filter((cube): cube is SavedCube => !!cube && typeof cube.id === 'string' &&
      typeof cube.name === 'string' && typeof cube.deviceName === 'string' && typeof cube.mac === 'string') : [];
  } catch { return []; }
}
function readSelected() { try { return localStorage.getItem(SELECTED_KEY) ?? ''; } catch { return ''; } }
export class CubeConnection {
  readonly adapter = new BluetoothCube();
  private listeners = new Set<() => void>();
  private events = new Set<(event: CubeEvent) => void>();
  private gesture: string[] = [];
  private lastSerial: number | undefined;
  private snapshot = { connection: null as SmartCubeConnection | null, connecting: false, calibrating: false, practicing: false, status: '', error: '', battery: null as number | null, cubes: readCubes(), selected: readSelected() };
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  private update(patch: Partial<typeof this.snapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(listener => listener()); }
  onEvent(listener: (event: CubeEvent) => void) { this.events.add(listener); return () => { this.events.delete(listener); }; }
  setPracticing(practicing: boolean) { this.update({ practicing }); }
  private emit = (event: SmartCubeEvent) => {
    if (this.snapshot.calibrating && (event.type === 'MOVE' || event.type === 'FACELETS')) return;
    if (event.type === 'MOVE') {
      if (event.serial !== undefined && event.serial === this.lastSerial) return;
      if (event.serial !== undefined && this.lastSerial !== undefined && ((event.serial - this.lastSerial) & 255) !== 1) this.gesture = [];
      this.lastSerial = event.serial;
      this.gesture = [...this.gesture.slice(-5), event.move];
      if (this.gesture.join(' ') === "R R' R R' R R'") { void this.calibrate().catch(() => {}); return; }
    }
    if (event.type === 'DISCONNECT') {
      this.gesture = []; this.lastSerial = undefined;
      const wasConnected = !!this.snapshot.connection;
      this.update({ connection: null, battery: null, status: 'Cube disconnected.' });
      if (wasConnected) void this.adapter.disconnect().catch(() => this.update({ error: 'Cube disconnect failed.' }));
    }
    if (event.type === 'BATTERY') this.update({ battery: event.batteryLevel });
    this.events.forEach(listener => listener(event));
  };
  async readState() {
    this.update({ error: '' });
    try { await this.adapter.refresh(); this.update({ status: 'Cube state requested.' }); }
    catch (failure) { this.update({ error: failure instanceof Error ? failure.message : 'Cube state could not be read.' }); throw failure; }
  }
  async calibrate() {
    if (!this.snapshot.connection || this.snapshot.calibrating) return;
    const connection = this.snapshot.connection;
    this.gesture = []; this.lastSerial = undefined;
    this.update({ calibrating: true, error: '' });
    this.events.forEach(listener => listener({ type: 'CALIBRATE', stage: 'start' }));
    try {
      await this.adapter.calibrate();
      if (this.snapshot.connection !== connection) return;
      this.events.forEach(listener => listener({ type: 'CALIBRATE', stage: 'complete' }));
      this.update({ status: 'Cube recalibrated as solved.' });
    } catch (failure) { this.update({ error: failure instanceof Error ? failure.message : 'Calibration failed.' }); throw failure; }
    finally { this.update({ calibrating: false }); }
  }
  select(id: string) {
    this.update({ selected: id });
    try { localStorage.setItem(SELECTED_KEY, id); } catch { this.update({ error: 'Cube selection could not be saved.' }); }
  }
  save(cube: SavedCube) {
    const cubes = [...this.snapshot.cubes.filter(saved => saved.id !== cube.id), cube];
    this.update({ cubes });
    try { localStorage.setItem(CUBES_KEY, JSON.stringify(cubes)); } catch { this.update({ error: 'Your cubes could not be saved in this browser.' }); }
    this.select(cube.id);
  }
  forget(id: string) {
    const cubes = this.snapshot.cubes.filter(cube => cube.id !== id);
    this.update({ cubes });
    if (this.snapshot.selected === id) this.select('');
    try { localStorage.setItem(CUBES_KEY, JSON.stringify(cubes)); } catch { this.update({ error: 'Your cubes could not be saved in this browser.' }); }
  }
  async connect(mac?: string) {
    if (this.snapshot.connecting || this.snapshot.connection) return;
    const selected = this.snapshot.cubes.find(cube => cube.id === this.snapshot.selected);
    this.gesture = []; this.lastSerial = undefined;
    this.update({ connecting: true, error: '', status: 'Connecting...' });
    try {
      await this.adapter.connect(mac ?? selected?.mac ?? '', this.emit, connection => {
        this.update({ connection });
        const existing = this.snapshot.cubes.find(cube => connection.deviceMAC ? cube.mac.toLowerCase() === connection.deviceMAC.toLowerCase() : cube.deviceName === connection.deviceName) ??
          (selected && (!selected.deviceName || selected.deviceName === connection.deviceName) ? selected : undefined);
        this.save({ id: existing?.id ?? crypto.randomUUID(), name: existing?.name ?? connection.deviceName ?? 'Smart cube',
          deviceName: connection.deviceName ?? 'Smart cube', mac: connection.deviceMAC || mac || selected?.mac || '' });
      }, status => this.update({ status }), selected?.deviceName);
      this.update({ status: 'Cube connected.' });
    } catch (failure) {
      await this.disconnect().catch(() => {});
      this.update({ error: failure instanceof Error ? failure.message : 'Cube connection failed.', status: '' });
      throw failure;
    } finally { this.update({ connecting: false }); }
  }
  async disconnect() {
    const wasConnected = !!this.snapshot.connection;
    this.update({ connection: null, battery: null });
    try { await this.adapter.disconnect(); }
    finally { if (wasConnected) this.events.forEach(listener => listener({ type: 'DISCONNECT', timestamp: performance.now() })); }
  }
}
export const cubeConnection = new CubeConnection();
export const useCubeConnection = () => useSyncExternalStore(cubeConnection.subscribe, cubeConnection.getSnapshot);
