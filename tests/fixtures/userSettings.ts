import type { Settings } from '../../src/cloud/backupSettings';

const trainer = { upcomingCases: false, caseNames: false, solutionAlgorithms: false, randomPreAuf: false, randomPostAuf: true, hidePLL: true, crossColor: 'White', frontColor: 'Blue' };
export const userSettings: Settings = {
  theme: '90s',
  'timer-time-precision': '3',
  'timer-last-cube-mac': '12:34:56:78:9A:BC',
  'recent-solve-limit': '2500',
  'timer-inspection': 'true',
  'timer-over-turn-penalty': 'true',
  'timer-show-every-long-pb': 'true',
  'timer-hide-distracting-visuals': '{"timer":true,"cube":false,"progressBar":true}',
  'timer-sessions': '["Practice","Empty session"]',
  'timer-session-scramblers': '{"Practice":"easy-xcross","Empty session":"2-gen"}',
  'selected-session': 'Empty session',
  'timer-all-session-history': 'true',
  'timer-non-favorite-mistakes': 'true',
  'timer-non-favorite-categories': '{"F2L":false,"OLL":true,"PLL":false}',
  'cuberplus-database-favorites': '["PLL-T:R U R\'"]',
  'cuberplus-unlearn-algorithms': '["PLL-T:R U R\'"]',
  'cuberplus-custom-algorithms': '{"PLL-T":["R U R\'"]}',
  'cuberplus-cloud-auto-100': 'true',
  'cuberplus-cloud-auto-pb': 'true',
  'cuberplus-trainer-settings-v1': JSON.stringify(trainer),
  'cuberplus-trainer-blitz-v1': JSON.stringify([{
    id: 'blitz-1', kind: 'PLL', date: '2026-11-13T12:34:56Z', milliseconds: 3000, dnf: true, settings: trainer,
    splits: [
      { caseId: 'T', milliseconds: 1000, recognitionMilliseconds: 300, executionMilliseconds: 700, dnf: true, retry: true },
      { caseId: 'T', milliseconds: 2000, recognitionMilliseconds: 500, executionMilliseconds: 1500, auf: 'U', preAuf: 'U', postAuf: "U'",
        colorFrame: 'x y2', crossColor: 'White', frontColor: 'Blue', permutation: { edges: [1, 0, 3, 2], corners: [0, 1, 2, 3] } },
    ],
  }]),
  'cuberplus-trainer-custom-v1': '[{"id":"training-1","name":"My cases","cases":["PLL-T","OLL-21"]}]',
  'cuberplus-trainer-practice-v1': '[{"id":"attempt-1","date":"2026-11-13T12:34:56Z","trainingId":"training-1","caseKey":"PLL-T","algorithm":"R U R\'","recognitionMilliseconds":250,"executionMilliseconds":750,"dnf":true}]',
  'cuberplus-my-cubes-v1': '[{"id":"cube-1","name":"My main cube","deviceName":"GAN","mac":"AA:BB:CC:DD:EE:FF"}]',
  'cuberplus-selected-cube': 'cube-1',
};
export const excludedSettings = {
  'msal.token': 'msal-secret', 'oauth-access-token': 'oauth-secret', 'unrelated-secret': 'secret',
  'timer-pb-daily-records': '{"date":"2026-11-13","records":["Ao100"]}',
  'cuberplus-cloud-provider': 'microsoft',
  'cuberplus-cloud-progress': '{"pending":["not-backed-up-progress"],"pbs":["not-backed-up-pb"],"lastBackup":{"microsoft":"2026-11-13T00:00:00Z"}}',
};
