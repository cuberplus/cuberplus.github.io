import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { KPattern } from 'cubing/kpuzzle';
import type { Cube } from '../../timer/src/Core/puzzle';
import { CasePractice } from '../../src/trainer/CasePractice';
import { DrillCaseImage } from '../../src/trainer/DrillCaseImage';
import { Practice } from '../../src/trainer/practice';
import { algorithms } from '../../src/database/algorithms';

jest.mock('../../src/trainer/practice', () => ({
  Practice: jest.fn(), readAttempts: () => [], readTrainings: () => [{ id: 'mixed', name: 'Mixed', cases: ['OLL-27', 'PLL-T', 'F2L-1'] }],
}));
jest.mock('../../timer/src/Analysis/cfop', () => ({}));
jest.mock('../../timer/src/Components/CubeView', () => ({ CubeView: () => null }));
jest.mock('../../src/trainer/SolutionProgress', () => ({ SolutionProgress: () => null }));
jest.mock('../../shared/cube/connection', () => ({
  useCubeConnection: () => ({ connection: {} }), cubeConnection: { onEvent: () => () => {} },
}));
const settings = { upcomingCases: true, caseNames: true, hidePLL: true, crossColor: 'Yellow', frontColor: 'Green' } as const;
const pattern = {} as KPattern;
const facelets = jest.fn((_pattern: KPattern) => 'URFDLB'.split('').map(face => face.repeat(9)).join(''));
const applyAlg = jest.fn(() => ({ patternData: { CENTERS: { pieces: [0, 1, 2, 3, 4, 5] } } }));
const cube = { facelets, solved: () => ({ applyAlg }) } as Partial<Cube> as Cube;
afterEach(() => { cleanup(); jest.clearAllMocks(); });

test.each(['single', 'custom'] as const)('%s practice shows each queued setup with its own frame and OLL-only hiding', mode => {
  const queue = ['OLL-27', 'OLL-27', 'PLL-T', 'F2L-1'].map((key, index) => ({
    ...algorithms.find(entry => `${entry.category}-${entry.id}` === key)!,
    pattern: { index } as Partial<KPattern> as KPattern,
    preAuf: ['U', 'U2', "U'", ''][index], postAuf: ['', 'U', 'U2', "U'"][index], colorFrame: ['', 'x', 'y', 'z2'][index],
  }));
  const practice = { phase: 'running', queue, pattern, moves: [], splitAt: performance.now(), tick: () => {} };
  jest.mocked(Practice).mockImplementation(() => practice as Partial<Practice> as Practice);
  const view = render(<CasePractice cube={cube} mode={mode} initialCase={mode === 'single' ? 'OLL-27' : ''} settings={settings} back={() => {}} />);
  if (mode === 'custom') {
    fireEvent.change(screen.getByLabelText('Saved training'), { target: { value: 'mixed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start practice' }));
  }
  const previews = view.container.querySelector('[aria-label="Upcoming 3 cases"]')!;
  expect(previews.children).toHaveLength(3);
  queue.slice(1).forEach((entry, index) => {
    const preview = previews.children[index] as HTMLElement;
    expect(preview.getAttribute('data-pre-auf')).toBe(entry.preAuf);
    expect(preview.getAttribute('data-post-auf')).toBe(entry.postAuf);
    expect(preview.getAttribute('data-color-frame')).toBe(entry.colorFrame);
    const image = within(preview).getByRole('img', { name: `${entry.category} ${entry.id} case` });
    expect(image.querySelector('title')?.textContent?.includes('other stickers gray')).toBe(entry.category === 'OLL');
    expect(facelets).toHaveBeenCalledWith(entry.pattern);
    expect(applyAlg).toHaveBeenCalledWith(entry.colorFrame);
  });
  view.rerender(<CasePractice cube={cube} mode={mode} initialCase={mode === 'single' ? 'OLL-27' : ''} settings={{ ...settings, caseNames: false }} back={() => {}} />);
  for (const entry of queue.slice(1)) expect(facelets.mock.calls.filter(([pattern]) => pattern === entry.pattern)).toHaveLength(1);
});
test('unchanged image props do not recalculate cube patterns during parent updates', () => {
  const props = { cube, category: 'PLL' as const, id: 'T', pattern, colorFrame: 'z2' };
  const view = render(<DrillCaseImage {...props} />);
  const computed = facelets.mock.calls.length;
  view.rerender(<DrillCaseImage {...props} />);
  expect(facelets).toHaveBeenCalledTimes(computed);
  view.rerender(<DrillCaseImage {...props} colorFrame="x" />);
  expect(facelets).toHaveBeenCalledTimes(computed + 1);
});
