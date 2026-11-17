import { cleanup, render, screen } from '@testing-library/react';
import { BreakReminder } from '../../timer/src/Components/BreakReminder';
import { solveFeedback } from '../../shared/workers/dataClient';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import { StepName } from '../../smartcubeanalyzer/src/Models/Types';
import type { Solve } from '../../timer/src/Core/engine';

jest.mock('../../shared/workers/dataClient', () => ({ solveFeedback: jest.fn() }));
const solve: Solve = {
  version: 1, id: 'slow', session: 'Default', createdAt: '2026-11-16T12:00:00Z', device: 'test',
  scramble: 'R', startFacelets: '', duration: 30000, status: 'complete', reason: '', timingBasis: 'host', moves: [],
};
const timerBreak = { until: Date.now() + 120000, solveId: solve.id, reason: 'Slower than your average.' };
beforeEach(() => jest.clearAllMocks());
afterEach(cleanup);
test('ordinary breaks have no drill or disable action and do not request analysis', () => {
  render(<BreakReminder timerBreak={timerBreak} history={[solve]} drills={false} remaining={120} />);
  expect(screen.getByRole('timer').textContent).toBe('2:00');
  expect(screen.getByText('Get up, drink some water, and take a moment to think.')).toBeDefined();
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(solveFeedback).not.toHaveBeenCalled();
});
test('opt-in suggestions link directly to the case for the highest-cost supported mistake', async () => {
  const [analysis] = parseCsv('id,date,dnf,time,solving_method\nslow,2026-11-16 12:00:00,false,30000,CFOP', ',');
  const step = { time: 10, recognitionTime: 4, executionTime: 6, preAufTime: 0, postAufTime: 0, turns: 14, tps: 2, moves: '' };
  analysis.steps = [{ ...step, name: StepName.OLL, case: '27' }, { ...step, name: StepName.PLL, case: 'T' }];
  analysis.mistakes = [{ kind: 'ollRecognition', estimatedSeconds: 2 }, { kind: 'pllRecognition', estimatedSeconds: 6 }];
  jest.mocked(solveFeedback).mockResolvedValue({ analysis } as Awaited<ReturnType<typeof solveFeedback>>);
  render(<BreakReminder timerBreak={timerBreak} history={[solve]} drills remaining={95} />);
  expect((await screen.findByRole('link')).getAttribute('href')).toBe('/trainer/?case=PLL-T');
  expect(screen.getByText(/PLL: Long recognition/)).toBeDefined();
});
test('failed analysis leaves the timer break active without inventing a drill', async () => {
  jest.mocked(solveFeedback).mockRejectedValue(new Error('worker unavailable'));
  render(<BreakReminder timerBreak={timerBreak} history={[solve]} drills remaining={90} />);
  expect(await screen.findByText('No specific case drill could be identified from this solve.')).toBeDefined();
  expect(screen.getByRole('timer').textContent).toBe('1:30');
  expect(screen.queryByRole('button')).toBeNull();
});
