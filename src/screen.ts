import { strict as assert } from 'assert'
import { Request, Response, Router } from 'express'
import rfb from 'rfb2'
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas'
import GifEncoder from 'gif-encoder'
import Routable from './routable'
import counter from './counter'
import {
  Rect,
  spreadSize,
  drawWindow
} from './gui'
import {
  REFRESH_RATE_MS,
  SCREEN_SIZE,
  UNIT_PADDING,
  UNIT_THICKNESS,
  COLOURS
} from './config'

interface UpdateRect extends Rect {
  encoding: rfb.encodings
  data: Buffer
}

export default class Screen implements Routable {
  static readonly rect: Rect = {
    x: 0,
    y: 0,
    width: SCREEN_SIZE.width + 2 * UNIT_PADDING,
    height: SCREEN_SIZE.height + 2 * UNIT_PADDING + UNIT_THICKNESS
  }

  static readonly width: number = Screen.rect.width
  static readonly height: number = Screen.rect.height
  readonly contentRect: Rect
  readonly canvas: Canvas
  readonly context: CanvasRenderingContext2D
  readonly router: Router = Router()
  readonly rfbConnection: rfb.RfbClient
  gifIdCounter: Generator<number> = counter()
  gifs: Map<number, GifEncoder> = new Map()
  tickTimer: ReturnType<typeof setInterval> | null = null

  constructor (rfbConnection: rfb.RfbClient) {
    this.canvas = createCanvas(...spreadSize(Screen.rect))
    this.context = this.canvas.getContext('2d')
    this.contentRect = drawWindow(
      this.context,
      Screen.rect,
      'Play multiplayer OpenTTD on my Github Readme!',
      COLOURS.brown,
      COLOURS.white,
      COLOURS.brown,
      COLOURS.black
    )

    this.rfbConnection = rfbConnection

    this.router.get('/stream.gif', this.onGifConnect)
    this.rfbConnection.on('rect', this.onScreenUpdate)
    this.rfbConnection.on('connect', this.onRfbConnect)
  }

  destroy () {
    if (this.tickTimer != null) {
      clearInterval(this.tickTimer)
    }
    this.gifs.forEach(gif => gif.destroy())
    this.rfbConnection.off('connect', this.onRfbConnect)
    this.rfbConnection.off('rect', this.onScreenUpdate)
  }

  private onRfbConnect = () : void => {
    if (this.tickTimer != null) {
      clearInterval(this.tickTimer)
    }
    this.tickTimer = setInterval(() => {
      this.onTick()
    }, REFRESH_RATE_MS)
  }

  private onTick = () : void => {
    for (const gifId of this.gifs.keys()) {
      this.pushToGif(gifId)
    }
    this.rfbConnection.requestUpdate(
      false, // incremental
      0, // x
      0, // y
      this.rfbConnection.width,
      this.rfbConnection.height
    )
  }

  private onScreenUpdate = (rect: UpdateRect) : void => {
    assert.equal(rect.encoding, rfb.encodings.raw)

    // Assume rect.data is in BGRA. Convert to ARGB (canvas ImageData format).
    const imageDataRgba = this.context.createImageData(rect.width, rect.height)
    for (let i = 0; i < rect.data.length; i += 4) {
      imageDataRgba.data[i + 0] = rect.data[i + 2]
      imageDataRgba.data[i + 1] = rect.data[i + 1]
      imageDataRgba.data[i + 2] = rect.data[i + 0]
      imageDataRgba.data[i + 3] = 0xFF
    }

    // Don't draw over our beautiful window border.
    const x = rect.x + this.contentRect.x
    const y = rect.y + this.contentRect.y
    const width = Math.min(rect.width, this.contentRect.width - rect.x)
    const height = Math.min(rect.height, this.contentRect.height - rect.x)

    this.context.putImageData(imageDataRgba, x, y, 0, 0, width, height)
  }

  private onGifConnect = (request: Request, response: Response) : void => {
    const gifId = this.gifIdCounter.next().value
    console.log(`request ${gifId} opened`)

    const gif = new GifEncoder(...spreadSize(this.canvas))
    gif.on('error', (error) => {
      console.error(`Error from gif for request ${gifId}`)
      console.error(error)
    })

    response.type('image/gif')
    gif.pipe(response)

    gif.writeHeader()
    this.gifs.set(gifId, gif)
    this.pushToGif(gifId)

    request.on('close', () => {
      console.log(`request ${gifId} closed`)
      this.gifs.delete(gifId)
    })
  }

  private pushToGif (gifId: number) {
    const gif = this.gifs.get(gifId)
    assert(gif instanceof GifEncoder, `Request ${gifId} not found`)
    gif.addFrame(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data)
  }

  getRouter () : Router {
    return this.router
  }
}
