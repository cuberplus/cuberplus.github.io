import { useSyncExternalStore } from 'react';
import type { SmartCubeConnection, SmartCubeEvent } from 'smartcube-web-bluetooth';
import { BluetoothCube } from '../../timer/src/Bluetooth/bluetooth';

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
  private events = new Set<(event: SmartCubeEvent) => void>();
  private snapshot = { connection: null as SmartCubeConnection | null, connecting: false, status: '', error: '', battery: null as number | null, cubes: readCubes(), selected: readSelected() };
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  private update(patch: Partial<typeof this.snapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(listener => listener()); }
  onEvent(listener: (event: SmartCubeEvent) => void) { this.events.add(listener); return () => { this.events.delete(listener); }; }
  private emit = (event: SmartCubeEvent) => {
    if (event.type === 'DISCONNECT') {
      const wasConnected = !!this.snapshot.connection;
      this.update({ connection: null, battery: null, status: 'Cube disconnected.' });
      if (wasConnected) void this.adapter.disconnect().catch(() => this.update({ error: 'Cube disconnect failed.' }));
    }
    if (event.type === 'BATTERY') this.update({ battery: event.batteryLevel });
    this.events.forEach(listener => listener(event));
  };
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
