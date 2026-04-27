type ShutdownFn = () => Promise<void>

const slot = (() => {
  const g = globalThis as typeof globalThis & {
    __webSyncPlayShutdown?: {
      installed: boolean
      handlers: ShutdownFn[]
    }
  }
  g.__webSyncPlayShutdown ??= { installed: false, handlers: [] }
  return g.__webSyncPlayShutdown
})()

/** LIFO: last registered runs first (WebSocket before Redis). */
export function registerShutdownHandler(fn: ShutdownFn) {
  slot.handlers.unshift(fn)
}

export function installShutdownOnce() {
  if (slot.installed) {
    return
  }
  slot.installed = true

  const run = async () => {
    const handlers = [...slot.handlers]
    for (const h of handlers) {
      try {
        await h()
      } catch (e) {
        console.error("[shutdown] handler failed", e)
      }
    }
  }

  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.once(sig, () => {
      void run()
    })
  }
  process.once("beforeExit", () => {
    void run()
  })
}
