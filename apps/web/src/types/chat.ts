export type Message = {
  id: string
  room: string
  content: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  timestamp: Date
}

export type PrivateMessage = {
  id: string
  content: string
  from: {
    id: string
    username: string
  }
  to: {
    id: string
    username: string
  }
  timestamp: Date
}

export type User = {
  id: string
  username: string
  avatar?: string
}

export type RoomType = 'global' | 'fr' | 'en' | string
