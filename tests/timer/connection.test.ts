/** @jest-environment jsdom */
import { beforeEach, expect, jest, test } from '@jest/globals';
import type { SmartCubeConnection, SmartCubeEvent } from 'smartcube-web-bluetooth';

let receive: (event: SmartCubeEvent) => void;
const connect = jest.fn<(mac: string, event: (event: SmartCubeEvent) => void, ready: (connection: SmartCubeConnection) => void, status: (message: string) => void, name?: string) => Promise<void>>();
const disconnect = jest.fn<() => Promise<void>>().mockResolvedValue();
await jest.unstable_mockModule('../../timer/src/Bluetooth/bluetooth', () => ({ BluetoothCube: class { connect = connect; disconnect = disconnect; } }));
const { CubeConnection } = await import('../../shared/cube/connection');
const device = { deviceName: 'GAN Test', deviceMAC: 'AA:BB:CC:DD:EE:FF' } as SmartCubeConnection;
beforeEach(() => {
  localStorage.clear(); disconnect.mockClear();
  connect.mockReset().mockImplementation(async (_mac, event, ready) => { receive = event; ready(device); });
  Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: () => 'cube-id' });
});
test('one connection broadcasts events to Timer and Trainer without reopening Bluetooth', async () => {
  const service = new CubeConnection(), timer = jest.fn(), trainer = jest.fn();
  const unsubscribe = service.onEvent(timer); service.onEvent(trainer);
  await service.connect(); await service.connect();
  expect(connect).toHaveBeenCalledTimes(1);
  receive({ type: 'BATTERY', timestamp: 0, batteryLevel: 85 });
  expect(timer).toHaveBeenCalledTimes(1); expect(trainer).toHaveBeenCalledTimes(1);
  expect(service.getSnapshot().battery).toBe(85);
  unsubscribe();
  receive({ type: 'BATTERY', timestamp: 1, batteryLevel: 84 });
  expect(timer).toHaveBeenCalledTimes(1); expect(trainer).toHaveBeenCalledTimes(2);
  await service.disconnect();
  expect(trainer).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'DISCONNECT' }));
  expect(service.getSnapshot().connection).toBeNull();
});
test('saved cubes retain custom names and MACs across reconnects and reloads', async () => {
  const service = new CubeConnection();
  service.save({ id: 'my-gan', name: 'Practice cube', mac: device.deviceMAC, deviceName: device.deviceName });
  service.save({ id: 'other', name: 'Travel cube', mac: '11:22:33:44:55:66', deviceName: 'Other' });
  service.select('my-gan');
  await service.connect();
  expect(connect).toHaveBeenCalledWith(device.deviceMAC, expect.any(Function), expect.any(Function), expect.any(Function), device.deviceName);
  expect(service.getSnapshot().cubes).toHaveLength(2);
  expect(service.getSnapshot().cubes.find(cube => cube.id === 'my-gan')?.name).toBe('Practice cube');
  const reloaded = new CubeConnection();
  expect(reloaded.getSnapshot().selected).toBe('my-gan');
  expect(reloaded.getSnapshot().cubes).toHaveLength(2);
  reloaded.forget('my-gan');
  expect(reloaded.getSnapshot().selected).toBe('');
  expect(new CubeConnection().getSnapshot().cubes.map(cube => cube.id)).toEqual(['other']);
});
test('an unexpected disconnect clears the connection and battery; failed setup can be retried', async () => {
  const service = new CubeConnection();
  await service.connect();
  receive({ type: 'BATTERY', timestamp: 0, batteryLevel: 80 });
  receive({ type: 'DISCONNECT', timestamp: 1 });
  expect(service.getSnapshot()).toMatchObject({ connection: null, battery: null });
  connect.mockRejectedValueOnce(new Error('Connection failed'));
  await expect(service.connect()).rejects.toThrow('Connection failed');
  expect(service.getSnapshot()).toMatchObject({ connection: null, connecting: false, error: 'Connection failed' });
  await service.connect();
  expect(service.getSnapshot().connection).toBe(device);
});
