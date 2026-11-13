import { render, screen } from '@testing-library/react';
import { CubeButton } from '../../shared/Components/CubeConnection';
import type { SavedCube } from '../../shared/cube/connection';

let mockSnapshot: { cubes: SavedCube[]; selected: string; connection: { deviceName: string; deviceMAC?: string } | null };
jest.mock('../../shared/cube/connection', () => ({ useCubeConnection: () => mockSnapshot }));
beforeEach(() => {
  mockSnapshot = { cubes: [
    { id: 'desk', name: 'Desk cube', deviceName: 'GAN Cube', mac: 'aa:bb:cc:dd:ee:ff' },
    { id: 'travel', name: 'Travel cube', deviceName: 'Other Cube', mac: '' },
  ], selected: 'travel', connection: null };
});
test('disconnected buttons show the selected saved name and retain their accessible setup label', () => {
  render(<CubeButton connected={false} open={() => {}} />);
  expect(screen.getByRole('button', { name: 'Bluetooth cube setup' }).textContent).toContain('Travel cube');
});
test.each([undefined, 'AA:BB:CC:DD:EE:FF'])('connected name follows the actual device even after selecting another cube (%s)', deviceMAC => {
  mockSnapshot.connection = { deviceName: 'GAN Cube', deviceMAC };
  render(<CubeButton connected open={() => {}} />);
  expect(screen.getByRole('button', { name: 'Bluetooth cube setup' }).textContent).toContain('Desk cube');
});
test('an unsaved device falls back to its Bluetooth name', () => {
  mockSnapshot.connection = { deviceName: 'New cube' };
  render(<CubeButton connected open={() => {}} />);
  expect(screen.getByRole('button', { name: 'Bluetooth cube setup' }).textContent).toContain('New cube');
});
