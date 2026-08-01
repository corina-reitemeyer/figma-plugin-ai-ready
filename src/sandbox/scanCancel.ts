let cancelRequested = false

export function requestScanCancel(): void {
  cancelRequested = true
}

export function resetScanCancel(): void {
  cancelRequested = false
}

export function isScanCancelled(): boolean {
  return cancelRequested
}
