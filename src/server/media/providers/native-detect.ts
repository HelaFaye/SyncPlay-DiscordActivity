import { canPlayNatively, isNativeProviderUrl } from "@/lib/player-utils"

export function detectNativeSupport(url: string) {
  return {
    canPlayNatively: canPlayNatively(url),
    isNativeProvider: isNativeProviderUrl(url),
  }
}
