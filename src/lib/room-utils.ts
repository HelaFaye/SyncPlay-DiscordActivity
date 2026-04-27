import type { ParticipantState } from "@/zod/types"
import {
  adjectives,
  animals,
  colors,
  names,
  starWars,
  uniqueNamesGenerator,
} from "unique-names-generator"
import { getRandomItem } from "./utils"

export function randomRoomId(): string {
  return `${Math.random().toString(36).slice(2, 10)}`
}

export const nameLists = [adjectives, animals, colors, starWars, names] as const

export function getRandomName(words = 2): string {
  const dictionaries = []
  for (let i = 0; i < words; i++) {
    dictionaries.push(getRandomItem(nameLists))
  }

  return uniqueNamesGenerator({
    dictionaries,
    length: words,
    style: "capital",
  }).replace("_", " ")
}

export function normalizeRole(
  role: ParticipantState["role"],
): ParticipantState["role"] {
  if (role === "owner" || role === "moderator" || role === "guest") {
    return role
  }
  return "guest"
}
