import { strict as assert } from 'assert'
import express from 'express'
import GifEncoder from 'gif-encoder'
import { createCanvas } from 'canvas'
import rfb from 'rfb2'

const REFRESH_RATE_MS = 300
const SCREEN_SIZE = {
  width: 640,
  height: 480
}

const app = express()

console.log('Connecting to VNC...')
const rfbConnection = rfb.createConnection({
  host: '127.0.0.1',
  port: 32771
})

rfbConnection.on('error', (error: Error) => {
  console.error(error)
})

rfbConnection.on('connect', () => {
  const canvas = createCanvas(SCREEN_SIZE.width, SCREEN_SIZE.height)
  const canvasContext = canvas.getContext('2d')
  let nextRequestId = 0
  const requests: Map<number, GifEncoder> = new Map()

  function pushToRequest (requestId: number) {
    const encoder = requests.get(requestId)
    assert(encoder instanceof GifEncoder, `Request ${requestId} not found`)
    encoder.addFrame(canvasContext.getImageData(0, 0, canvas.width, canvas.height).data)
  }

  interface UpdateRectangle {
    encoding: rfb.encodings
    width: number
    height: number
    x: number
    y: number
    data: Buffer
  }

  rfbConnection.on('rect', (rect: UpdateRectangle) => {
    assert.equal(rect.encoding, rfb.encodings.raw)

    // Assume rect.data is in BGRA. Convert to ARGB (canvas ImageData format).
    const imageDataRgba = canvasContext.createImageData(rect.width, rect.height)
    for (let i = 0; i < rect.data.length; i += 4) {
      imageDataRgba.data[i + 0] = rect.data[i + 2]
      imageDataRgba.data[i + 1] = rect.data[i + 1]
      imageDataRgba.data[i + 2] = rect.data[i + 0]
      imageDataRgba.data[i + 3] = 0xFF
    }

    canvasContext.putImageData(imageDataRgba, rect.x, rect.y)
  })

  setInterval(() => {
    for (const requestId of requests.keys()) {
      pushToRequest(requestId)
    }
    rfbConnection.requestUpdate(false, 0, 0, rfbConnection.width, rfbConnection.height)
  }, REFRESH_RATE_MS)

  app.get('/', (_: express.Request, response: express.Response) => {
    response.send(`
      <html>
        <body>
          <img src="/video.gif">
        </body>
      </html>
    `)
  })

  app.get('/video.gif', (request: express.Request, response: express.Response) => {
    response.type('image/gif')
    const requestId = nextRequestId
    console.log(`request ${requestId} opened`)
    const encoder = new GifEncoder(SCREEN_SIZE.width, SCREEN_SIZE.height)
    encoder.on('error', (error) => {
      console.error(`Error from encoder for request ${requestId}`)
      console.error(error)
    })
    encoder.pipe(response)
    encoder.writeHeader()

    nextRequestId++

    requests.set(requestId, encoder)
    pushToRequest(requestId)

    request.on('close', () => {
      console.log(`request ${requestId} closed`)
      requests.delete(requestId)
    })
  })

  app.listen(3000, () => {
    console.log('Ready')
  })
})
