/**
 * Based on Matchbox
 * Matchbox https://gitlab.com/acefed/matchbox Copyright (c) 2022 Acefed MIT License
 */

import { Hono } from 'hono'
import { Env, Follower } from '../types'
import { exportPublicKey, importprivateKey, privateKeyToPublicKey } from '../utils'
import { acceptFollow, getInbox } from '../logic'

const app = new Hono<Env>()

app.get(':strName', async (c) => {
  const strName = c.req.param('strName')
  const strHost = new URL(c.req.url).hostname

  if (strName !== c.env.preferredUsername) return c.notFound()
  if (!c.req.header('Accept').includes('application/activity+json')) {
    return c.text(`${strName}: ${c.env.name}`)
  }

  const PRIVATE_KEY = await importprivateKey(c.env.PRIVATE_KEY)
  const PUBLIC_KEY = await privateKeyToPublicKey(PRIVATE_KEY)
  const public_key_pem = await exportPublicKey(PUBLIC_KEY)

  const r = {
    '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
    id: `https://${strHost}/u/${strName}`,
    type: 'Person',
    inbox: `https://${strHost}/u/${strName}/inbox`,
    followers: `https://${strHost}/u/${strName}/followers`,
    preferredUsername: strName,
    name: c.env.name,
    url: `https://${strHost}/u/${strName}`,
    publicKey: {
      id: `https://${strHost}/u/${strName}`,
      type: 'Key',
      owner: `https://${strHost}/u/${strName}`,
      publicKeyPem: public_key_pem,
    },
    icon: {
      type: 'Image',
      mediaType: 'image/png',
      url: `https://${strHost}/static/icon.png`,
    },
  }

  return c.json(r, 200, { 'Content-Type': 'activity+json' })
})

app.get(':strName/inbox', (c) => c.body(null, 405))
app.post(':strName/inbox', async (c) => {
  const strName = c.req.param('strName')
  const strHost = new URL(c.req.url).hostname

  if (strName !== c.env.preferredUsername) return c.notFound()
  if (!c.req.header('Content-Type').includes('application/activity+json')) return c.body(null, 400)
  const y = await c.req.json<any>()
  if (new URL(y.actor).protocol !== 'https:') return c.body(null, 400)

  const x = await getInbox(y.actor)
  if (!x) return c.body(null, 500)

  const private_key = await importprivateKey(c.env.PRIVATE_KEY)

  if (y.type === 'Follow') {
    const actor = y.actor
    await c.env.DB.prepare(`INSERT OR REPLACE INTO follower(id) VALUES(?);`).bind(actor).run()
    await acceptFollow(strName, strHost, x, y, private_key)
    return c.body(null)
  }

  if (y.type === 'Undo') {
    const z = y.object
    if (z.type === 'Follow') {
      await c.env.DB.prepare(`DELETE FROM follower WHERE id = ?;`).bind(y.actor).run()
      return c.body(null)
    }
  }

  return c.body(null, 500)
})

app.get(':strName/followers', async (c) => {
  const strName = c.req.param('strName')
  const strHost = new URL(c.req.url).hostname
  if (strName !== c.env.preferredUsername) return c.notFound()
  if (!c.req.header('Accept').includes('application/activity+json')) return c.body(null, 400)

  const { results } = await c.env.DB.prepare(`SELECT * FROM follower;`).all<Follower>()
  const followers = results

  const items = followers.map(({ id }) => {
    return id
  })

  const r = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${strHost}/u/${strName}/followers`,
    type: 'OrderedCollection',
    first: {
      type: 'OrderedCollectionPage',
      totalItems: followers.length,
      partOf: `https://${strHost}/u/${strName}/followers`,
      orderedItems: items,
      id: `https://${strHost}/u/${strName}/followers?page=1`,
    },
  }

  return c.json(r, 200, { 'Content-Type': 'activity+json' })
})

export default app
