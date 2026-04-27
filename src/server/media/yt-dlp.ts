import { env } from "@/env"
import { spawn } from "node:child_process"

export type YtDlpMetadata = {
  title: string | null
  durationSeconds: number | null
}

export async function extractPlayableUrl(url: string): Promise<string | null> {
  return await new Promise((resolve) => {
    const proc = spawn(env.YTDLP_BIN, ["-g", url], {
      stdio: ["ignore", "pipe", "ignore"],
    })
    let output = ""
    proc.stdout.on("data", (chunk) => (output += chunk.toString()))
    proc.on("close", (code) =>
      resolve(
        code === 0
          ? (output
              .split("\n")
              .map((v) => v.trim())
              .find(Boolean) ?? null)
          : null,
      ),
    )
  })
}

export async function extractMetadata(url: string): Promise<YtDlpMetadata> {
  return await new Promise<YtDlpMetadata>((resolve) => {
    const proc = spawn(env.YTDLP_BIN, ["--no-playlist", "--dump-single-json", url], {
      stdio: ["ignore", "pipe", "ignore"],
    })
    let output = ""
    proc.stdout.on("data", (chunk) => (output += chunk.toString()))
    proc.on("close", (code) => {
      if (code !== 0) {
        resolve({ title: null, durationSeconds: null })
        return
      }

      try {
        const parsed = JSON.parse(output) as {
          title?: unknown
          duration?: unknown
        }
        const title =
          typeof parsed.title === "string" && parsed.title.trim()
            ? parsed.title.trim()
            : null
        const durationSeconds =
          typeof parsed.duration === "number" && Number.isFinite(parsed.duration)
            ? Math.max(0, Math.round(parsed.duration))
            : null
        resolve({ title, durationSeconds })
      } catch {
        resolve({ title: null, durationSeconds: null })
      }
    })
  })
}
