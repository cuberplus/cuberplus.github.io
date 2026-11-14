// Only app-owned user data belongs here: never copy arbitrary origin storage or OAuth caches.
export type BackupValue = null | boolean | number | string | BackupValue[] | { [key: string]: BackupValue | undefined };
type Check = (value: BackupValue | undefined) => boolean;
const object = (value: BackupValue | undefined): value is Record<string, BackupValue | undefined> => !!value && typeof value === 'object' && !Array.isArray(value);
const string: Check = value => typeof value === 'string';
const boolean: Check = value => typeof value === 'boolean';
const time: Check = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const date: Check = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const oneOf = (...values: (string | number)[]): Check => value => values.some(item => item === value);
const array = (check: Check): Check => value => Array.isArray(value) && value.every(check);
const strings = array(string);
const optional = (check: Check): Check => value => value === undefined || check(value);
const fields = (schema: Record<string, Check>): Check => {
  const entries = Object.entries(schema);
  return value => object(value) && Object.keys(value).every(key => Object.hasOwn(schema, key)) &&
    entries.every(([key, check]) => check(value[key]));
};
const dictionary = (check: Check): Check => value => object(value) && Object.values(value).every(check);
const json = (check: Check): Check => value => {
  if (typeof value !== 'string') return false;
  try { return check(JSON.parse(value) as BackupValue); } catch { return false; }
};
const flag = oneOf('true', 'false');
const color = oneOf('White', 'Red', 'Green', 'Yellow', 'Orange', 'Blue');
const auf = oneOf('', 'U', 'U2', "U'");
const trainerSettings = fields({
  upcomingCases: optional(boolean), caseNames: optional(boolean), solutionAlgorithms: optional(boolean),
  randomPreAuf: optional(boolean), randomPostAuf: optional(boolean), hidePLL: optional(boolean),
  crossColor: optional(oneOf('White', 'Red', 'Green', 'Yellow', 'Orange', 'Blue', 'Random')),
  frontColor: optional(oneOf('White', 'Red', 'Green', 'Yellow', 'Orange', 'Blue', 'Random')),
});
const permutation: Check = value => {
  const pieces: Check = value => Array.isArray(value) && value.length === 4 && [...value].sort().join() === '0,1,2,3' && value.every(Number.isInteger);
  if (!fields({ edges: pieces, corners: pieces })(value) || !object(value)) return false;
  const parity = (value: BackupValue | undefined) => (value as number[]).reduce((sum, piece, i, all) =>
    sum + all.slice(i + 1).filter(next => next < piece).length, 0) % 2;
  return parity(value['edges']) === parity(value['corners']);
};
const splitFields = fields({
  caseId: string, milliseconds: time, dnf: optional(boolean), retry: optional(boolean),
  recognitionMilliseconds: optional(time), executionMilliseconds: optional(time),
  auf: optional(auf), preAuf: optional(auf), postAuf: optional(auf),
  colorFrame: optional(value => typeof value === 'string' && /^(?:[xz](?:2|')?)?(?: ?y(?:2|')?)?$/.test(value)),
  crossColor: optional(color), frontColor: optional(color), permutation: optional(permutation),
});
const split: Check = value => splitFields(value) && object(value) && (!value['retry'] || value['dnf'] === true) &&
  ((value['preAuf'] === undefined) === (value['postAuf'] === undefined)) &&
  (value['recognitionMilliseconds'] === undefined && value['executionMilliseconds'] === undefined ||
    typeof value['recognitionMilliseconds'] === 'number' && typeof value['executionMilliseconds'] === 'number' &&
    Math.abs(value['recognitionMilliseconds'] + value['executionMilliseconds'] - (value['milliseconds'] as number)) < .001);

const validators = {
  theme: oneOf('light', 'dark', 'aurora', 'disco', 'inferno', '90s'),
  'timer-time-precision': oneOf('2', '3'),
  'timer-last-cube-mac': value => typeof value === 'string' && (value === '' || /^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(value)),
  'recent-solve-limit': value => typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)),
  'timer-inspection': flag,
  'timer-over-turn-penalty': flag,
  'timer-show-every-long-pb': flag,
  'timer-hide-distracting-visuals': json(value => boolean(value) || fields({ timer: optional(boolean), cube: optional(boolean), progressBar: optional(boolean) })(value)),
  'timer-sessions': json(array(value => typeof value === 'string' && !!value.trim() && value.length <= 100)),
  'timer-session-scramblers': json(dictionary(oneOf('default', 'easy-cross', 'easy-xcross', '2-gen', '3-gen', 'doubles'))),
  'selected-session': value => typeof value === 'string' && !!value.trim() && value.length <= 100,
  'timer-all-session-history': flag,
  'timer-non-favorite-mistakes': flag,
  'timer-non-favorite-categories': json(fields({ F2L: optional(boolean), OLL: optional(boolean), PLL: optional(boolean) })),
  'cuberplus-database-favorites': json(strings),
  'cuberplus-unlearn-algorithms': json(strings),
  'cuberplus-custom-algorithms': json(dictionary(array(value => typeof value === 'string' && !!value.trim() && value.length <= 1000))),
  'cuberplus-cloud-auto-100': flag,
  'cuberplus-cloud-auto-pb': flag,
  'cuberplus-trainer-settings-v1': json(trainerSettings),
  'cuberplus-trainer-blitz-v1': json(array(fields({
    id: string, kind: oneOf('OLL', 'PLL'), date, milliseconds: time, dnf: optional(boolean),
    splits: array(split), settings: optional(trainerSettings),
  }))),
  'cuberplus-trainer-custom-v1': json(array(fields({ id: string, name: string, cases: value => strings(value) && (value as string[]).length > 0 }))),
  'cuberplus-trainer-practice-v1': json(array(fields({
    id: string, date, trainingId: string, caseKey: string, algorithm: optional(value => value === null || string(value)),
    recognitionMilliseconds: time, executionMilliseconds: time, dnf: optional(boolean),
  }))),
  'cuberplus-my-cubes-v1': json(array(fields({ id: string, name: string, deviceName: string, mac: string }))),
  'cuberplus-selected-cube': string,
} satisfies Record<string, Check>;
export const settingKeys = Object.keys(validators) as (keyof typeof validators)[];
export type Settings = Partial<Record<keyof typeof validators, string | null>>;

export function validateSettings(value: BackupValue | undefined): Settings {
  if (!object(value)) throw new Error('Invalid settings in backup. No local data was changed.');
  const settings: Settings = {};
  for (const key of settingKeys) {
    if (!Object.hasOwn(value, key)) continue;
    const saved = value[key];
    if (saved !== null && (typeof saved !== 'string' || !validators[key](saved))) {
      throw new Error(`Invalid ${key} in backup. No local data was changed.`);
    }
    settings[key] = saved;
  }
  return settings;
}
export function readSettings(): Settings {
  return validateSettings(Object.fromEntries(settingKeys.map(key => [key, localStorage.getItem(key)])));
}
function writeSettings(settings: Settings): void {
  for (const key of settingKeys) {
    const value = settings[key];
    if (value === null) localStorage.removeItem(key);
    else if (value !== undefined) localStorage.setItem(key, value);
  }
}
export async function restoreSettings(settings: Settings, save: () => Promise<void>): Promise<void> {
  const incoming = validateSettings(settings);
  if (!Object.keys(incoming).length) { await save(); return; }
  // Capture raw originals so even pre-existing invalid settings can be rolled back exactly.
  const previous = Object.fromEntries(settingKeys.map(key => [key, localStorage.getItem(key)]));
  try { writeSettings(incoming); await save(); }
  catch (failure) {
    try { writeSettings(previous); }
    catch { throw new Error('Restore failed and some settings could not be recovered. Your original solves have not been removed.'); }
    throw failure;
  }
}
