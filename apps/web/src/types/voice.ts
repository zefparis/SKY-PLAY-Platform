export type VoiceUser = {
  socketId: string
  userId: string
  username: string
  avatar?: string
  muted: boolean
  speaking: boolean
}

export type VoiceRoom = {
  id: string
  name: string
  users: VoiceUser[]
  maxUsers: number
}
