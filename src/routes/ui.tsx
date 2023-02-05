import { Hono } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import { Top } from './Pages'
import { Env, Message } from '../types'
import { validator } from 'hono/validator'
import { importprivateKey } from '../utils'
import { createNote, getInbox } from '../logic'

const app = new Hono<Env>()

app.use('*', async (c, next) => {
  const auth = basicAuth({
    username: c.env.BASIC_USERNAME,
    password: c.env.BASIC_PASSWORD,
  })
  return await auth(c, next)
})

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT * FROM message;`).all<Message>()
  const messages = results
  return c.html(<Top messages={messages} />)
})

app.post(
  '/post',
  validator('form', (value, c) => {
    if (!value['body']) {
      return c.text('Invalid!', 400)
    }
    return value as Message
  }),
  async (c) => {
    const message = c.req.valid('form')
    const messageId = crypto.randomUUID()

    const strHost = new URL(c.req.url).hostname
    const strName = c.env.preferredUsername

    const PRIVATE_KEY = await importprivateKey(c.env.PRIVATE_KEY)

    const { results } = await c.env.DB.prepare(`SELECT id FROM follower;`).all<{ id: string }>()
    const followers = results

    for (const follower of followers) {
      const x = await getInbox(follower.id)
      await createNote(messageId, strName, strHost, x, message.body, PRIVATE_KEY)
    }

    await c.env.DB.prepare(`INSERT INTO message(id, body) VALUES(?, ?);`)
      .bind(messageId, message.body)
      .run()

    return c.redirect('/ui')
  }
)

export default app
