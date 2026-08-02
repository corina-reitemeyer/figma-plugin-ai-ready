export type AiValueKind = 'raw' | 'token'

export type AiValueRow = {
  label: string
  value: string
  kind: AiValueKind
}

export type AiVariantProperty = {
  label: string
  value: string
}

/** Snapshot of how an agent would read the selected layer. */
export type AiComponentPreview = {
  name: string
  kindLabel: string
  sourceLabel: string
  variantProperties: AiVariantProperty[]
  layout: string[]
  values: AiValueRow[]
  description: string
}
