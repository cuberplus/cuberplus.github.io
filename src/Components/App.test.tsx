import React from 'react';
import { expect, test } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import App from './App';
import Navigation, { APP_VERSION } from '@cuberplus/navigation';

test('the homepage footer contains only the shared CuberPlus version', () => {
  render(<App />);
  expect(screen.getByRole('contentinfo').textContent).toBe(`CuberPlus ${APP_VERSION}`);
});

test.each(['home', 'timer', 'smartcubeanalyzer', 'scrambler', 'database', 'options'] as const)(
  'shared navigation marks only %s as the current page',
  current => {
    render(<Navigation current={current} />);
    const links = within(screen.getByRole('navigation', { name: 'CuberPlus' })).getAllByRole('link');
    expect(links).toHaveLength(6);
    const active = links.filter(link => link.getAttribute('aria-current') === 'page');
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('href')).toBe(current === 'home' ? '/' : `/${current}/`);
    expect(links.every(link => link.querySelector('svg[aria-hidden="true"]'))).toBe(true);
  },
);

test('the homepage offers Timer first, followed by Analyzer and Scrambler, with their correct live paths', () => {
  render(<App />);
  const tools = within(screen.getByRole('region', { name: 'Cubing tools' }));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('CuberPlus');
  expect(tools.getAllByRole('link').map(link => link.getAttribute('href'))).toEqual([
    '/timer/', '/smartcubeanalyzer/', '/scrambler/',
  ]);
  expect(tools.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)).toEqual([
    'Timer', 'Smartcube Analyzer', 'Scrambler', 'More coming soon',
  ]);
  expect(screen.queryByText(/The CuberPlus toolkit|Two tools\. Better solves\.|Analyze your solve data/)).toBeNull();
});

test('each tool has an accessible screenshot, description, features, and a clear action', () => {
  render(<App />);
  for (const name of ['Timer', 'Smartcube Analyzer', 'Scrambler']) {
    const card = within(screen.getByRole('region', { name: 'Cubing tools' })).getByRole('link', { name });
    const image = within(card).getByRole('img');
    expect(image.getAttribute('alt')).toMatch(/showing/);
    expect(image.getAttribute('src')).toBeTruthy();
    expect(image.getAttribute('width')).toBe('1440');
    expect(image.getAttribute('height')).toBe('900');
    expect(card.getAttribute('aria-describedby')).toBeTruthy();
    expect(within(card).getAllByRole('listitem')).toHaveLength(2);
    expect(within(card).getByText(/^Open /).textContent).toMatch(/Open (timer|analyzer|scrambler)/);
  }
  expect(screen.queryByText('Analyzer preview shown with demo data.')).toBeNull();
});

test('the brand and skip link remain alongside the shared navigation', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: 'CuberPlus home' }).getAttribute('href')).toBe('/');
  expect(screen.getByRole('link', { name: 'Skip to tools' }).getAttribute('href')).toBe('#tools');
  expect(screen.getByRole('region', { name: 'Cubing tools' }).id).toBe('tools');
  const navigation = screen.getByRole('navigation', { name: 'CuberPlus' });
  const links = within(navigation).getAllByRole('link');
  expect(links.map(link => [link.getAttribute('aria-label'), link.getAttribute('href')])).toEqual([
    ['Home', '/'], ['Timer', '/timer/'],
    ['Smartcube Analyzer', '/smartcubeanalyzer/'], ['Scrambler', '/scrambler/'],
    ['Database', '/database/'], ['Options', '/options/'],
  ]);
  expect(links[0].getAttribute('aria-current')).toBe('page');
  expect(links.slice(1).every(link => !link.hasAttribute('aria-current'))).toBe(true);
  expect(screen.queryByRole('link', { name: /GitHub|Explore tools/ })).toBeNull();
});

test('the coming-soon card is informational rather than a nonworking link', () => {
  render(<App />);
  const card = screen.getByRole('article', { name: 'More coming soon' });
  expect(within(card).getByText('More cubing tools are on the way.')).toBeTruthy();
  expect(within(card).queryByRole('link')).toBeNull();
  expect(within(card).queryByRole('button')).toBeNull();
});
