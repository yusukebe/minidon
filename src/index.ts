import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { logger } from 'hono/logger'
import ui from './routes/ui'
import webfinger from './routes/webfinger'
import user from './routes/user'

const app = new Hono()

app.use('*', logger())

app.get('/static/*', serveStatic({ root: './' }))

app.get('/', (c) => c.text('Minidon'))
app.route('/.well-known/webfinger', webfinger)
app.route('/u', user)
app.route('/ui', ui)

app.showRoutes()

export default app
