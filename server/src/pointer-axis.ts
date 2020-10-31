import { strict as assert } from 'assert'
import { EventEmitter } from 'events'
import _ from 'lodash'
import { Router, Request, Response } from 'express'
import { createCanvas, Canvas, CanvasRenderingContext2D, ImageData } from 'canvas'
import GifEncoder from 'gif-encoder'
import {
  Rect,
  sizeToRect,
  spreadSize,
  spreadRect,
  drawTriangle,
  ImageSet,
  Direction
} from './gui'
import Routable from './routable'
import {
  CURSOR_SIZE,
  CURSOR_BLINK_RATE_FPS,
  SCREEN_SIZE,
  UNIT_PADDING,
  IMAGE_MIN_HEIGHT,
  COLOURS
} from './config'

export interface PointerClickRect extends Rect {
  pointerPosition: number,
  imageSource: number
}

export interface PointerAxisImageSet<T> extends ImageSet<T> {
  full: T
  cursor: T
  clickSlices: T[]
}

abstract class PointerAxis extends EventEmitter implements Routable {
  readonly canvas: Canvas
  readonly context: CanvasRenderingContext2D
  background: PointerAxisImageSet<ImageData>
  foreground: PointerAxisImageSet<ImageData>
  gif: PointerAxisImageSet<Buffer>
  router: Router = Router()

  constructor () {
    super()
    const width = this.getWidth()
    const height = this.getHeight()
    this.canvas = createCanvas(width, height)
    this.context = this.canvas.getContext('2d')
    this.background = this.saveContextToImageSet()
    this.foreground = this.saveContextToImageSet()
    this.gif = this.updateGifs()
    this.drawBackground()
    this.drawForeground(Math.floor(SCREEN_SIZE.width / 2))

    this.router.get('/cursor.gif', (_, response: Response) => {
      response.type('image/gif')
      response.send(this.gif.cursor)
    })

    this.router.get('/:index.gif', (request: Request, response: Response) => {
      const index = parseInt(request.params.index)
      if (index < 0 || index >= this.gif.clickSlices.length) {
        response.status(400).send('Out of range')
      }
      response.type('image/gif')
      response.send(this.gif.clickSlices[index])
    })

    this.router.get('/:pointerPosition/move', (request: Request, response: Response) => {
      const pointerPosition = parseInt(request.params.pointerPosition)
      if (pointerPosition < 0 || pointerPosition >= SCREEN_SIZE.width) {
        response.status(400).send('Out of range')
      }
      this.emit('move', pointerPosition)
      response.redirect('back')
    })
  }

  abstract getWidth () : number
  abstract getHeight () : number
  abstract getSlices () : PointerClickRect[]
  abstract getRects () : PointerAxisImageSet<Rect>

  saveContextToImageSet () : PointerAxisImageSet<ImageData> {
    const imageSet: ImageSet<ImageData> = {}
    for (const [key, value] of Object.entries(this.getRects())) {
      if (Array.isArray(value)) {
        imageSet[key] = value.map(rect =>
          this.context.getImageData(...spreadRect(rect)))
      } else {
        imageSet[key] = this.context.getImageData(...spreadRect(value))
      }
    }
    return imageSet as PointerAxisImageSet<ImageData>
  }

  abstract drawBackground () : void

  abstract drawForeground (pointerPosition: number) : void

  updateGifs () : PointerAxisImageSet<Buffer> {
    const gifSet : ImageSet<Buffer> = {}
    for (const [key, value] of Object.entries(this.getRects())) {
      const background = this.background[key]
      const foreground = this.foreground[key]
      if (Array.isArray(value)) {
        assert(Array.isArray(background))
        assert(Array.isArray(foreground))
        assert.equal(background.length, foreground.length)
        gifSet[key] = _.zip(background, foreground).map(
          ([bg, fg]: [ImageData | undefined, ImageData | undefined]) => {
            assert(bg)
            assert(fg)
            return this.generateGif(bg, fg)
          }
        )
      } else {
        assert(background instanceof ImageData)
        assert(foreground instanceof ImageData)
        gifSet[key] = this.generateGif(background, foreground)
      }
    }
    this.gif = gifSet as PointerAxisImageSet<Buffer>
    return this.gif
  }

  private generateGif (background: ImageData, foreground: ImageData) : Buffer {
    const gif = new GifEncoder(...spreadSize(background))
    gif.setRepeat(0) // 0 = repeat indefinitely
    gif.setFrameRate(CURSOR_BLINK_RATE_FPS)
    gif.writeHeader()
    gif.addFrame(background.data)
    gif.addFrame(foreground.data)
    gif.finish()
    const buffer = gif.read()
    assert(buffer instanceof Buffer, 'gif data should be immediately available')
    return buffer
  }

  getRouter () : Router {
    return this.router
  }
}

export class PointerXAxis extends PointerAxis {
  static readonly width = SCREEN_SIZE.width + 2 * UNIT_PADDING
  static readonly height = 2 * IMAGE_MIN_HEIGHT
  static readonly clickSlices = (() => {
    const slices: PointerClickRect[] = []
    for (let x = 0; x < SCREEN_SIZE.width; x++) {
      slices.push({
        x: x + UNIT_PADDING,
        y: IMAGE_MIN_HEIGHT,
        width: 1,
        height: IMAGE_MIN_HEIGHT,
        pointerPosition: x,
        // All images are identical, so just use the same
        // image source url to speed up load times.
        imageSource: 0
      })
    }
    return slices
  })()

  static readonly rects = {
    full: {
      x: 0,
      y: 0,
      width: PointerXAxis.width,
      height: PointerXAxis.height
    },
    cursor: {
      x: 0,
      y: 0,
      width: PointerXAxis.width,
      height: IMAGE_MIN_HEIGHT
    },
    clickSlices: PointerXAxis.clickSlices
  }

  getWidth () {
    return PointerXAxis.width
  }

  getHeight () {
    return PointerXAxis.height
  }

  getSlices () {
    return PointerXAxis.clickSlices
  }

  getRects () {
    return PointerXAxis.rects
  }

  drawBackground () : void {
    this.context.save()
    this.context.fillStyle = COLOURS.white.main
    this.context.fillRect(...spreadRect(sizeToRect(this.canvas)))
    this.context.fillStyle = COLOURS.grey.main
    this.context.fillRect(UNIT_PADDING, IMAGE_MIN_HEIGHT, this.canvas.width, 1)
    this.context.fillRect(UNIT_PADDING, IMAGE_MIN_HEIGHT * 2 - 1, this.canvas.width, 1)
    this.context.restore()
    this.background = this.saveContextToImageSet()
  }

  drawForeground (pointerX: number) : void {
    this.context.save()

    this.context.putImageData(this.background.full, 0, 0)

    this.context.fillStyle = COLOURS.grey.main
    drawTriangle(this.context, pointerX + UNIT_PADDING, IMAGE_MIN_HEIGHT - 2, CURSOR_SIZE, Direction.DOWN)

    this.context.restore()
    this.foreground = this.saveContextToImageSet()
  }
}

export class PointerYAxis extends PointerAxis {
  static readonly width = CURSOR_SIZE + IMAGE_MIN_HEIGHT
  static readonly height = SCREEN_SIZE.height + 2 * UNIT_PADDING
  static readonly clickSlices = (() => {
    const PRECISION = 4
    const slices: PointerClickRect[] = []
    for (let y = 0; y < SCREEN_SIZE.height; y += IMAGE_MIN_HEIGHT) {
      for (let x = 0, i = 0; x < IMAGE_MIN_HEIGHT; x += PRECISION, i++) {
        slices.push({
          x: CURSOR_SIZE + x,
          y: y + UNIT_PADDING,
          width: PRECISION,
          height: IMAGE_MIN_HEIGHT,
          pointerPosition: y + IMAGE_MIN_HEIGHT - i,
          imageSource: i
        })
      }
    }
    return slices
  })()

  static readonly rects = {
    full: {
      x: 0,
      y: 0,
      width: PointerYAxis.width,
      height: PointerYAxis.height
    },
    cursor: {
      x: 0,
      y: 0,
      width: CURSOR_SIZE,
      height: PointerYAxis.height
    },
    clickSlices: PointerYAxis.clickSlices
  }

  getWidth () {
    return PointerYAxis.width
  }

  getHeight () {
    return PointerYAxis.height
  }

  getSlices () {
    return PointerYAxis.clickSlices
  }

  getRects () {
    return PointerYAxis.rects
  }

  drawBackground () : void {
    this.context.save()
    this.context.fillStyle = COLOURS.white.main
    this.context.fillRect(...spreadRect(sizeToRect(this.canvas)))
    for (let y = 0; y < SCREEN_SIZE.height; y += IMAGE_MIN_HEIGHT) {
      for (let i = 0; i < IMAGE_MIN_HEIGHT; i++) {
        this.context.fillStyle = COLOURS.grey.main
        this.context.fillRect(
          this.canvas.width - i - 1,
          UNIT_PADDING + y + i,
          1,
          1
        )
      }
    }
    this.context.restore()
    this.background = this.saveContextToImageSet()
  }

  drawForeground (pointerY: number) : void {
    this.context.save()

    this.context.putImageData(this.background.full, 0, 0)

    this.context.fillStyle = COLOURS.grey.main
    drawTriangle(this.context, CURSOR_SIZE - 1, pointerY + UNIT_PADDING, CURSOR_SIZE, Direction.RIGHT)

    this.context.restore()
    this.foreground = this.saveContextToImageSet()
  }
}
