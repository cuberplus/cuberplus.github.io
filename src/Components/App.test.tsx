import React from 'react';
import { expect, test } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import App from './App';

test('the homepage offers both tools with their correct live paths', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('CuberPlus');
  expect(screen.getByRole('link', { name: 'Smartcube Analyzer' }).getAttribute('href')).toBe('https://cuberplus.com/smartcubeanalyzer/');
  expect(screen.getByRole('link', { name: 'Scrambler' }).getAttribute('href')).toBe('https://cuberplus.com/scrambler/');
  expect(screen.queryByText(/The CuberPlus toolkit|Two tools\. Better solves\.|Analyze your solve data/)).toBeNull();
});

test('each tool has an accessible screenshot, description, features, and a clear action', () => {
  render(<App />);
  for (const name of ['Smartcube Analyzer', 'Scrambler']) {
    const card = screen.getByRole('link', { name });
    const image = within(card).getByRole('img');
    expect(image.getAttribute('alt')).toMatch(/showing/);
    expect(image.getAttribute('src')).toBeTruthy();
    expect(image.getAttribute('width')).toBe('1440');
    expect(image.getAttribute('height')).toBe('900');
    expect(card.getAttribute('aria-describedby')).toBeTruthy();
    expect(within(card).getAllByRole('listitem')).toHaveLength(2);
    expect(within(card).getByText(/^Open /).textContent).toMatch(/Open (analyzer|scrambler)/);
  }
  expect(screen.queryByText('Analyzer preview shown with demo data.')).toBeNull();
});

test('the brand and skip link remain without the top-right navigation', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: 'CuberPlus home' }).getAttribute('href')).toBe('/');
  expect(screen.getByRole('link', { name: 'Skip to tools' }).getAttribute('href')).toBe('#tools');
  expect(screen.getByRole('region', { name: 'Cubing tools' }).id).toBe('tools');
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.queryByRole('link', { name: /GitHub|Explore tools/ })).toBeNull();
});

test('the coming-soon card is informational rather than a nonworking link', () => {
  render(<App />);
  const card = screen.getByRole('article', { name: 'More coming soon' });
  expect(within(card).getByText('More cubing tools are on the way.')).toBeTruthy();
  expect(within(card).queryByRole('link')).toBeNull();
  expect(within(card).queryByRole('button')).toBeNull();
});
