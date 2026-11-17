import { useEffect, useState } from 'react';
import { rankedMistakes, mistakeLabel } from '../../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { solveFeedback } from '../../../shared/workers/dataClient';
import { databaseCaseKeys } from '../../../src/database/algorithms';
import { findTrainingCase, trainingLink } from '../../../src/trainer/cases';
import { caseKeyLabel } from '../../../src/database/caseLabels';
import { mistakeTrainingKey } from '../Analysis/mistakeSummary';
import { type TimerBreak } from '../Core/breakReminder';
import type { Solve } from '../Core/engine';

export function BreakReminder({ timerBreak, history, drills, remaining }: {
  timerBreak: TimerBreak; history: Solve[]; drills: boolean; remaining: number;
}) {
  const [suggestion, setSuggestion] = useState<{ key: string; reason: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  useEffect(() => {
    let active = true;
    setSuggestion(null);
    const solve = history.find(solve => solve.id === timerBreak.solveId);
    if (!drills || !solve) return;
    setAnalyzing(true);
    void solveFeedback(solve, history.filter(item => item.session === solve.session), () => active).then(result => {
      if (!active || !('analysis' in result) || !result.analysis) return;
      const analysis = result.analysis;
      for (const mistake of rankedMistakes(analysis)) {
        const key = mistakeTrainingKey(analysis, mistake);
        if (key) { setSuggestion({ key, reason: mistakeLabel(mistake) }); return; }
      }
      const steps = [...analysis.steps].sort((a, b) => b.recognitionTime - a.recognitionTime);
      for (const step of steps) {
        const key = databaseCaseKeys(step.name.startsWith('F2L') ? 'F2L' : step.name, step.case).find(findTrainingCase);
        if (key) { setSuggestion({ key, reason: `${step.name} recognition` }); return; }
      }
    }).catch(() => {}).finally(() => { if (active) setAnalyzing(false); });
    return () => { active = false; };
  }, [timerBreak.solveId, drills, history]);
  return <section className="panel text-center py-4" aria-labelledby="break-reminder-title">
    <h2 id="break-reminder-title">Time for a break</h2>
    <p>{timerBreak.reason}</p>
    <p>Get up, drink some water, and take a moment to think.</p>
    <p className="h3" role="timer" aria-label="Break time remaining">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</p>
    <p>The timer unlocks when your break ends.</p>
    {drills && (suggestion ? <p>{suggestion.reason}: <a href={trainingLink(suggestion.key)}>Practice {caseKeyLabel(suggestion.key)}</a></p> :
      <p className="text-secondary">{analyzing ? 'Finding a drill from your solve...' : 'No specific case drill could be identified from this solve.'}</p>)}
  </section>;
}
