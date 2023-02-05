import { Hono } from 'hono'
import { Env } from 'hono'

const app = new Hono<Env>()

app.get('/', (c) => {
  const strName = c.env.preferredUsername
  const strHost = new URL(c.req.url).hostname
  if (c.req.query('resource') !== `acct:${strName}@${strHost}`) return c.notFound()
  const r = {
    subject: `acct:${strName}@${strHost}`,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `https://${strHost}/u/${strName}`,
      },
    ],
  }
  return c.json(r, 200, { 'Content-Type': 'jrd+json' })
})

export default app
