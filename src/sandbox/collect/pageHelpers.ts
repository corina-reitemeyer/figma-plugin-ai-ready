export function getContainingPage(node: BaseNode): PageNode | null {
  let current: BaseNode | null = node
  while (current !== null) {
    if (current.type === 'PAGE') {
      return current
    }
    current = current.parent
  }
  return null
}

export async function ensurePageLoaded(page: PageNode): Promise<void> {
  await page.loadAsync()
}
