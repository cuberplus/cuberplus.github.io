import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BreakReminderOptions } from '../../shared/Components/BreakReminderOptions';
import { BREAK_ACTIVE, breakDefaults, readBreakSettings, writeBreakSettings } from '../../timer/src/Core/breakReminder';

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } });
});
afterEach(cleanup);
test('disabling requires two warnings, cancel keeps the feature and active break, and final confirmation clears both', () => {
  writeBreakSettings({ ...breakDefaults, enabled: true });
  localStorage.setItem(BREAK_ACTIVE, JSON.stringify({ until: Date.now() + 120000, solveId: 'slow', reason: 'Slow solve' }));
  render(<BreakReminderOptions />);
  fireEvent.click(screen.getByRole('button', { name: 'Break reminder', exact: true }));
  const toggle = screen.getByRole('checkbox', { name: 'Enable break reminders' });
  fireEvent.click(toggle);
  expect(screen.getByRole('dialog').textContent).toContain('Are you sure you want to continue?');
  expect(readBreakSettings().enabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Continue to final warning' }));
  expect(readBreakSettings().enabled).toBe(true);
  expect(localStorage.getItem(BREAK_ACTIVE)).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Keep reminders' }));
  expect(readBreakSettings().enabled).toBe(true);
  fireEvent.click(toggle);
  fireEvent.click(screen.getByRole('button', { name: 'Continue to final warning' }));
  fireEvent.click(screen.getByRole('button', { name: 'Disable reminders' }));
  expect(readBreakSettings().enabled).toBe(false);
  expect(localStorage.getItem(BREAK_ACTIVE)).toBeNull();
});
test('duration and thresholds are customizable and synchronize between settings instances', () => {
  writeBreakSettings({ ...breakDefaults, enabled: true });
  const view = render(<BreakReminderOptions />);
  fireEvent.click(screen.getByRole('button', { name: 'Break reminder', exact: true }));
  const disclosure = screen.getByText('Customize break reminders').closest('details')!;
  expect(disclosure.open).toBe(false);
  expect(screen.getByRole('checkbox', { name: 'Enable break reminders' }).closest('details')).toBeNull();
  fireEvent.click(screen.getByText('Customize break reminders'));
  expect(disclosure.open).toBe(true);
  expect(screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Single-solve slowdown multiplier' }).value).toBe('2');
  const average = screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Average window (solves)' });
  expect(average.value).toBe('100');
  expect(screen.queryByLabelText('Single-solve average window')).toBeNull();
  expect(screen.queryByLabelText('Streak average window')).toBeNull();
  expect(screen.queryByLabelText('Completed solves before reminders')).toBeNull();
  fireEvent.blur(average, { target: { value: '50' } });
  expect(readBreakSettings().streakWindow).toBe(50);
  const minutes = screen.getByRole('spinbutton', { name: 'Break length (minutes)' });
  fireEvent.blur(minutes, { target: { value: '3' } });
  expect(readBreakSettings().minutes).toBe(3);
  const grace = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Start sessions without lockouts' });
  expect(grace.checked).toBe(true);
  fireEvent.blur(screen.getByRole('spinbutton', { name: 'Lockout-free session time (minutes)' }), { target: { value: '5' } });
  expect(readBreakSettings().graceMinutes).toBe(5);
  fireEvent.click(grace);
  expect(readBreakSettings().graceEnabled).toBe(false);
  const drills = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Suggest a targeted drill during breaks' });
  expect(drills.checked).toBe(true);
  fireEvent.click(drills);
  expect(readBreakSettings().drills).toBe(false);
  view.unmount();
  render(<BreakReminderOptions />);
  fireEvent.click(screen.getByRole('button', { name: 'Break reminder', exact: true }));
  fireEvent.click(screen.getByText('Customize break reminders'));
  expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Suggest a targeted drill during breaks' }).checked).toBe(false);
  expect(screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Average window (solves)' }).value).toBe('50');
  expect(screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Break length (minutes)' }).value).toBe('3');
});
test('dependent options are disabled without losing settings and grace controls only its duration', () => {
  const view = render(<BreakReminderOptions />);
  fireEvent.click(screen.getByRole('button', { name: 'Break reminder', exact: true }));
  fireEvent.click(screen.getByText('Customize break reminders'));
  const enabled = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Enable break reminders' });
  const grace = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Start sessions without lockouts' });
  const duration = screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Lockout-free session time (minutes)' });
  const average = screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Average window (solves)' });
  for (const control of [...screen.getAllByRole('checkbox').slice(1), ...screen.getAllByRole('spinbutton')]) {
    expect(control.matches(':disabled')).toBe(true);
  }
  expect(enabled.disabled).toBe(false);
  fireEvent.blur(average, { target: { value: '50' } });
  expect(readBreakSettings().streakWindow).toBe(100);
  fireEvent.click(enabled);
  expect(grace.matches(':disabled')).toBe(false);
  expect(duration.matches(':disabled')).toBe(false);
  fireEvent.click(grace);
  expect(duration.disabled).toBe(true);
  expect(average.matches(':disabled')).toBe(false);
  expect(readBreakSettings().graceMinutes).toBe(10);
  fireEvent.click(grace);
  expect(duration.disabled).toBe(false);
  expect(duration.value).toBe('10');
  view.rerender(<BreakReminderOptions disabled />);
  for (const control of [...screen.getAllByRole('checkbox'), ...screen.getAllByRole('spinbutton')]) {
    expect(control.matches(':disabled')).toBe(true);
  }
});
