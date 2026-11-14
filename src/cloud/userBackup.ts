import { backupJSON, validateBackupData, type BackupEnvelope } from '../../timer/src/Data/storage';
import type { Solve } from '../../timer/src/Core/engine';
import type { Cube } from '../../timer/src/Core/puzzle';
import { readSettings, validateSettings, type Settings } from './backupSettings';

// Keep the Timer envelope readable by existing importers; settings are an additive extension.
export const userBackupJSON = (solves: Solve[]): string => backupJSON(solves, readSettings());
export function validateUserBackup(json: string, cube: Cube): { solves: Solve[]; settings: Settings } {
  const backup = JSON.parse(json) as BackupEnvelope & { settings?: Settings };
  const settings = backup && Object.hasOwn(backup, 'settings') ? validateSettings(backup.settings) : {};
  return { solves: validateBackupData(backup, cube), settings };
}
