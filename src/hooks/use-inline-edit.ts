import { useCallback, useState } from "react"

interface InlineEditConfig {
  initialValue?: string
  onCommit: (nextValue: string) => void
}

export function useInlineEdit(config: InlineEditConfig) {
  const [draft, setDraft] = useState(config.initialValue ?? "")

  const reset = useCallback((value: string) => {
    setDraft(value)
  }, [])

  const commit = useCallback(
    (currentValue: string) => {
      const trimmed = (draft || currentValue).trim()
      if (!trimmed || trimmed === currentValue) {
        setDraft(currentValue)
        return
      }
      config.onCommit(trimmed)
    },
    [config, draft],
  )

  return {
    draft,
    setDraft,
    reset,
    commit,
  }
}
