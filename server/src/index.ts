import 'source-map-support/register'
import express from 'express'
import nocache from 'nocache'
import html from './html'
import Session from './session'

const session = new Session()

const app = express()
app.use(nocache())

app.get('/', (_: express.Request, response: express.Response) => {
  response.send(html)
})

app.use(session.getRouter())

app.listen(3000, () => {
  console.log('Ready')
})
