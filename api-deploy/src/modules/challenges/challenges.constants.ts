export const ALLOWED_GAMES = [
  'FIFA',
  'eFootball',
  'Call of Duty',
  'Mortal Kombat',
  'Street Fighter',
  'Tekken',
  'EA Sports FC',
] as const;

export type AllowedGame = typeof ALLOWED_GAMES[number];

export const FORBIDDEN_GAME_TYPES = [
  'battle_royale',
  'adventure',
  'mmorpg',
] as const;

export const CHALLENGE_TYPES = {
  DUEL: { maxPlayers: 2, entryFee: 2000, commission: 0.25 },
  SMALL_CHALLENGE: { maxPlayers: 5, entryFee: 2000, commission: 0.20 },
  STANDARD: { maxPlayers: 10, entryFee: 2000, commission: 0.10 },
  MEDIUM_TOURNAMENT: { maxPlayers: 20, entryFee: 2000, commission: 0.15 },
  BIG_TOURNAMENT: { maxPlayers: 50, entryFee: 2000, commission: 0.10 },
  PREMIUM_TOURNAMENT: { maxPlayers: 100, entryFee: 5000, commission: 0.10 },
} as const;

export const PRIZE_DISTRIBUTION = {
  FIRST: 0.50,
  SECOND: 0.25,
  THIRD: 0.15,
} as const;

export const MANUAL_REVIEW_THRESHOLD = 10000; // 10 000 SKY — validation admin obligatoire
export const AUTO_APPROVE_DELAY_MS = 30 * 60 * 1000; // 30 min avant crédit automatique
