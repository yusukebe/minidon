import { html } from 'hono/html'
import { Message } from '../types'

const Form = () => {
  return (
    <form action='/ui/post' method='POST'>
      <label>
        <textarea name='body' rows='3' cols='33'></textarea>
      </label>
      <input type='submit' />
    </form>
  )
}

export const Top = (props: { messages: Message[] }) => {
  return (
    <Layout>
      <h1>
        <a href='/ui'>Minidon</a>
      </h1>
      <Form />
      <hr />
      {props.messages.reverse().map((message) => {
        return <article>{message.body}</article>
      })}
    </Layout>
  )
}

const Layout = (props: any) => html`<!DOCTYPE html>
  <html>
    <head>
      <title>Minidon</title>
      <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css" />
    </head>
    <body>
      <main class="container">${props.children}</main>
    </body>
  </html>`
