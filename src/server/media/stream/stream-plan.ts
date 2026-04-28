export type StreamPlanInput = {
  playableUrl: string
  isNativeProvider: boolean
  corsAllowed: boolean
}

export function buildStreamPlan(input: StreamPlanInput): {
  playbackMode: "direct" | "relay"
} {
  if (input.isNativeProvider || input.corsAllowed) {
    return { playbackMode: "direct" }
  }
  return { playbackMode: "relay" }
}
