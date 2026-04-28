export async function probeCorsPlayback(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      headers: {
        Range: "bytes=0-1",
      },
    })
    const allowOrigin = response.headers.get("access-control-allow-origin")
    return Boolean(
      allowOrigin && (allowOrigin === "*" || allowOrigin.includes("http")),
    )
  } catch {
    return false
  }
}
