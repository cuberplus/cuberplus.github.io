import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DebouncedNumber } from '../../shared/Components/DebouncedNumber';

beforeEach(() => jest.useFakeTimers());
afterEach(() => { cleanup(); jest.useRealTimers(); });
test('clearing and retyping a number applies only the final value after a quiet period', () => {
  const changed = jest.fn();
  render(<DebouncedNumber aria-label="Filter" value={300} onChange={event => changed(event.target.value)} />);
  const input = screen.getByRole('spinbutton') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '' } });
  act(() => jest.advanceTimersByTime(600));
  expect(input.value).toBe('');
  expect(changed).not.toHaveBeenCalled();
  for (const value of ['2', '25', '250']) {
    fireEvent.change(input, { target: { value } });
    act(() => jest.advanceTimersByTime(200));
    expect(changed).not.toHaveBeenCalled();
  }
  act(() => jest.advanceTimersByTime(250));
  expect(changed.mock.calls).toEqual([['250']]);
});
test('reset, disabling, and unmounting cancel pending filter edits', () => {
  const changed = jest.fn();
  const view = render(<DebouncedNumber value={300} onChange={changed} />);
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '25' } });
  view.rerender(<DebouncedNumber value={100} onChange={changed} />);
  act(() => jest.advanceTimersByTime(500));
  expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('100');
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });
  view.rerender(<DebouncedNumber value={100} disabled onChange={changed} />);
  act(() => jest.advanceTimersByTime(500));
  view.rerender(<DebouncedNumber value={100} onChange={changed} />);
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '80' } });
  view.unmount();
  act(() => jest.advanceTimersByTime(500));
  expect(changed).not.toHaveBeenCalled();
});
