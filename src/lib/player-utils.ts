export const directMediaPattern =
  /\.(mp4|webm|m3u8|mpd|mp3|ogg|wav|flac|m4a|aac|weba|m4v|mov|ogv|ts|m2ts)(\?|$)/i

export const nativeProviderHosts = [
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "vimeo.com",
] as const

export function isNativeProviderUrl(rawUrl: string) {
  try {
    const { hostname } = new URL(rawUrl)
    const host = hostname.toLowerCase()
    return nativeProviderHosts.some(
      (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`),
    )
  } catch {
    return false
  }
}

export function canPlayNatively(rawUrl: string) {
  return directMediaPattern.test(rawUrl) || isNativeProviderUrl(rawUrl)
}
