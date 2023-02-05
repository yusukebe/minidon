export type Env = {
  Bindings: {
    DB: D1Database
    preferredUsername: string
    name: string
    PRIVATE_KEY: string
    BASIC_USERNAME: string
    BASIC_PASSWORD: string
  }
}

export type Follower = {
  id: string
}

export type Message = {
  id: string
  body: string
}
