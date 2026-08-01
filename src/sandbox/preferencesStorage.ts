import {
  parseScanPreferences,
  SCAN_PREFERENCES_KEY,
  ScanPreferences
} from '../shared/preferences'

export async function readScanPreferences(): Promise<ScanPreferences | null> {
  try {
    const value = await figma.clientStorage.getAsync(SCAN_PREFERENCES_KEY)
    return parseScanPreferences(value)
  } catch {
    return null
  }
}

export async function writeScanPreferences(
  preferences: ScanPreferences
): Promise<void> {
  try {
    await figma.clientStorage.setAsync(SCAN_PREFERENCES_KEY, preferences)
  } catch {
    // ignore storage errors — choice still applies for this session
  }
}
