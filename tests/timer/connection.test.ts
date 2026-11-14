/** @jest-environment jsdom */
import { beforeEach, expect, jest, test } from '@jest/globals';
import type { SmartCubeConnection, SmartCubeEvent } from 'smartcube-web-bluetooth';

let receive: (event: SmartCubeEvent) => void;
const connect = jest.fn<(mac: string, event: (event: SmartCubeEvent) => void, ready: (connection: SmartCubeConnection) => void, status: (message: string) => void, name?: string) => Promise<void>>();
const disconnect = jest.fn<() => Promise<void>>().mockResolvedValue();
const calibrate = jest.fn<() => Promise<void>>().mockResolvedValue(), refresh = jest.fn<() => Promise<void>>().mockResolvedValue();
await jest.unstable_mockModule('../../timer/src/Bluetooth/bluetooth', () => ({ BluetoothCube: class { connect = connect; disconnect = disconnect; calibrate = calibrate; refresh = refresh; } }));
const { CubeConnection } = await import('../../shared/cube/connection');
const device = { deviceName: 'GAN Test', deviceMAC: 'AA:BB:CC:DD:EE:FF' } as SmartCubeConnection;
beforeEach(() => {
  localStorage.clear(); disconnect.mockClear(); calibrate.mockClear(); refresh.mockClear();
  connect.mockReset().mockImplementation(async (_mac, event, ready) => { receive = event; ready(device); });
  Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: () => 'cube-id' });
});
const turn = (move: string, serial?: number): SmartCubeEvent => ({ type: 'MOVE', timestamp: 0, move, serial, face: 1, direction: move.endsWith("'") ? 1 : 0, localTimestamp: 0, cubeTimestamp: null });
test('the exact recalibration gesture aborts listeners before resetting and declaring solved', async () => {
  const service = new CubeConnection(), events = jest.fn();
  service.onEvent(events); await service.connect();
  for (const move of ['R', "R'", 'U', 'R', "R'", 'R', "R'"]) receive(turn(move));
  expect(calibrate).not.toHaveBeenCalled();
  receive(turn('R')); receive(turn("R'"));
  expect(calibrate).toHaveBeenCalledTimes(1);
  expect(events).toHaveBeenLastCalledWith({ type: 'CALIBRATE', stage: 'start' });
  await Promise.resolve();
  expect(events).toHaveBeenLastCalledWith({ type: 'CALIBRATE', stage: 'complete' });
  expect(service.getSnapshot().status).toBe('Cube recalibrated as solved.');
});
test('duplicate packets cannot complete the gesture and gaps reset its prefix', async () => {
  const service = new CubeConnection(); await service.connect();
  receive(turn('R', 1)); receive(turn("R'", 2)); receive(turn('R', 1)); receive(turn("R'", 2));
  receive(turn('R', 3)); receive(turn("R'", 4)); receive(turn("R'", 4));
  expect(calibrate).not.toHaveBeenCalled();
  receive(turn('R', 7)); receive(turn("R'", 8));
  expect(calibrate).not.toHaveBeenCalled();
});
test('manual state reading and calibration share the hardware path and report reset failures', async () => {
  const service = new CubeConnection(), listener = jest.fn();
  service.onEvent(listener); await service.connect(); await service.readState();
  expect(refresh).toHaveBeenCalledTimes(1);
  calibrate.mockRejectedValueOnce(new Error('Reset failed'));
  await expect(service.calibrate()).rejects.toThrow('Reset failed');
  expect(listener).toHaveBeenCalledWith({ type: 'CALIBRATE', stage: 'start' });
  expect(listener).not.toHaveBeenCalledWith({ type: 'CALIBRATE', stage: 'complete' });
  expect(service.getSnapshot()).toMatchObject({ calibrating: false, error: 'Reset failed' });
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
