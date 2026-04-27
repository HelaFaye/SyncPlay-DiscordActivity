"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className={cn("border-t px-3 py-4 text-sm text-muted-foreground")}>
      <div
        className={cn(
          "mx-auto flex w-full flex-col items-start justify-between gap-2 sm:flex-row sm:items-center",
        )}
      >
        <Link
          href="https://github.com/Web-SyncPlay/Web-SyncPlay"
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-4"
        >
          GitHub Repository
        </Link>
        <p>
          Copyright © 2026{" "}
          <Link
            href="https://github.com/Yasamato"
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-4"
          >
            Yasamato
          </Link>
        </p>
      </div>
    </footer>
  )
}
