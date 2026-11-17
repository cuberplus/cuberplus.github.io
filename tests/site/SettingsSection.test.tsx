import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsSection } from '../../shared/Components/SettingsSection';
import { InfoTip } from '../../shared/Components/InfoTip';

test('categories collapse independently, retain their controls and keep help outside collapsed content', async () => {
  render(<>
    <SettingsSection title="First" help={<InfoTip>First category help</InfoTip>}><label>Setting<input defaultValue="saved" /></label></SettingsSection>
    <SettingsSection title="Second"><button>Second setting</button></SettingsSection>
  </>);
  const first = screen.getByRole('button', { name: 'First' }), second = screen.getByRole('button', { name: 'Second' });
  expect(first.getAttribute('aria-expanded')).toBe('false');
  expect(second.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Second setting' })).toBeNull();
  fireEvent.click(first);
  fireEvent.click(second);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'edited' } });
  fireEvent.click(first);
  expect(first.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.getByRole('button', { name: 'Second setting' })).toBeDefined();
  fireEvent.focus(screen.getByRole('button', { name: 'First category help' }));
  expect((await screen.findByRole('tooltip')).textContent).toBe('First category help');
  fireEvent.click(second);
  expect(second.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(first);
  expect(first.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('edited');
  expect(document.getElementById(first.getAttribute('aria-controls')!)!.hidden).toBe(false);
  expect(screen.queryByRole('button', { name: 'Second setting' })).toBeNull();
});
