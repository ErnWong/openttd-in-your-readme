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
  drawRidged,
  ImageSet
} from './gui'
import Routable from './routable'
import {
  POINTER_AXIS_PRECISION,
  CURSOR_BLINK_RATE_FPS,
  SCREEN_SIZE,
  UNIT_PADDING,
  UNIT_THICKNESS,
  IMAGE_MIN_HEIGHT,
  COLOURS
} from './config'

export interface PointerClickRect extends Rect {
  pointerPosition: number
}

export interface PointerAxisImageSet<T> extends ImageSet<T> {
  full: T
  sliced: T[]
  top: T
  bottom: T
  left: T
  right: T
}

abstract class PointerAxis extends EventEmitter implements Routable {
  static generateRects (width: number, height: number, slices: Rect[]) {
    return {
      full: {
        x: 0,
        y: 0,
        width,
        height
      },
      sliced: slices,
      top: {
        x: 0,
        y: 0,
        width,
        height: UNIT_PADDING
      },
      bottom: {
        x: 0,
        y: height - UNIT_PADDING,
        width,
        height: UNIT_PADDING
      },
      left: {
        x: 0,
        y: UNIT_PADDING,
        width: UNIT_PADDING,
        height: slices[0].height
      },
      right: {
        x: width - UNIT_PADDING,
        y: UNIT_PADDING,
        width: UNIT_PADDING,
        height: slices[0].height
      }
    }
  }

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
    const slices = this.getSlices()
    this.canvas = createCanvas(width, height)
    this.context = this.canvas.getContext('2d')
    this.background = this.saveContextToImageSet()
    this.foreground = this.saveContextToImageSet()
    this.gif = this.updateGifs()
    this.drawBackground()
    this.drawForeground(Math.floor(slices.length / 2))

    for (const border of ['top', 'bottom', 'left', 'right']) {
      this.router.get(`/${border}.gif`, (_, response: Response) => {
        response.type('image/gif')
        response.send(this.gif[border])
      })
    }

    this.router.get('/:pointerPosition/image.gif', (request: Request, response: Response) => {
      const pointerPosition = parseInt(request.params.pointerPosition)
      if (pointerPosition < 0 || pointerPosition >= this.gif.sliced.length) {
        response.status(400).send('Out of range')
      }
      response.type('image/gif')
      response.send(this.gif.sliced[pointerPosition])
    })

    this.router.get('/:pointerPosition/move', (request: Request, response: Response) => {
      const pointerPosition = parseInt(request.params.pointerPosition)
      if (pointerPosition < 0 || pointerPosition >= this.getSlices().length) {
        response.status(400).send('Out of range')
      }
      this.emit('move', this.getSlices()[pointerPosition].pointerPosition)
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

  drawBackground () : void {
    drawRidged(this.context, sizeToRect(this.canvas), COLOURS.grey, COLOURS.grey)
    this.background = this.saveContextToImageSet()
  }

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
  static readonly height = UNIT_THICKNESS
  static readonly slices = (() => {
    const slices: PointerClickRect[] = []
    for (let x = 0; x < SCREEN_SIZE.width; x += POINTER_AXIS_PRECISION) {
      slices.push({
        x: UNIT_PADDING + x,
        y: UNIT_PADDING,
        width: POINTER_AXIS_PRECISION,
        height: UNIT_THICKNESS - 2 * UNIT_PADDING,
        pointerPosition: x
      })
    }
    return slices
  })()

  static readonly rects = PointerXAxis.generateRects(
    PointerXAxis.width,
    PointerXAxis.height,
    PointerXAxis.slices
  )

  getWidth () {
    return PointerXAxis.width
  }

  getHeight () {
    return PointerXAxis.height
  }

  getSlices () {
    return PointerXAxis.slices
  }

  getRects () {
    return PointerXAxis.rects
  }

  drawForeground (pointerX: number) : void {
    this.context.save()
    this.context.putImageData(this.background.full, 0, 0)
    this.context.fillStyle = COLOURS.white.shadow
    this.context.fillRect(pointerX - 1, UNIT_PADDING + 1, 5, UNIT_THICKNESS - 2 * UNIT_PADDING - 3)
    this.context.fillRect(pointerX, UNIT_THICKNESS - UNIT_PADDING - 2, 3, 1)
    this.context.fillRect(pointerX + 1, UNIT_THICKNESS - UNIT_PADDING - 1, 1, 1)
    this.context.fillStyle = COLOURS.white.main
    this.context.fillRect(pointerX - 2, UNIT_PADDING, 5, UNIT_THICKNESS - 2 * UNIT_PADDING - 3)
    this.context.fillRect(pointerX - 1, UNIT_THICKNESS - UNIT_PADDING - 3, 3, 1)
    this.context.fillRect(pointerX, UNIT_THICKNESS - UNIT_PADDING - 2, 1, 1)
    this.context.restore()
    this.foreground = this.saveContextToImageSet()
  }
}

export class PointerYAxis extends PointerAxis {
  static readonly width = IMAGE_MIN_HEIGHT + 2 * UNIT_PADDING
  static readonly height = SCREEN_SIZE.height + 2 * UNIT_PADDING
  static readonly slices = (() => {
    const slices: PointerClickRect[] = []
    for (let y = 0; y < SCREEN_SIZE.height; y += IMAGE_MIN_HEIGHT) {
      for (let i = 0; i < IMAGE_MIN_HEIGHT; i += POINTER_AXIS_PRECISION) {
        slices.push({
          x: UNIT_PADDING + i,
          y: y + UNIT_PADDING,
          width: POINTER_AXIS_PRECISION,
          height: IMAGE_MIN_HEIGHT,
          pointerPosition: y + IMAGE_MIN_HEIGHT - i
        })
      }
    }
    return slices
  })()

  static readonly rects = PointerYAxis.generateRects(
    PointerYAxis.width,
    PointerYAxis.height,
    PointerYAxis.slices
  )

  getWidth () {
    return PointerYAxis.width
  }

  getHeight () {
    return PointerYAxis.height
  }

  getSlices () {
    return PointerYAxis.slices
  }

  getRects () {
    return PointerYAxis.rects
  }

  drawBackground () : void {
    super.drawBackground()
    this.context.save()
    for (let y = 0; y < SCREEN_SIZE.height; y += IMAGE_MIN_HEIGHT) {
      for (let i = 0; i < IMAGE_MIN_HEIGHT; i++) {
        this.context.fillStyle = COLOURS.grey.shadow
        this.context.fillRect(
          this.canvas.width - UNIT_PADDING - i - 1,
          UNIT_PADDING + y + i,
          1,
          1
        )
        this.context.fillStyle = COLOURS.grey.highlight
        this.context.fillRect(
          this.canvas.width - UNIT_PADDING - i - 1,
          UNIT_PADDING + y + i + 1,
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
    this.context.fillStyle = COLOURS.white.shadow
    this.context.fillRect(UNIT_PADDING + 1, pointerY - 1, IMAGE_MIN_HEIGHT - 2 * UNIT_PADDING - 3, 5)
    this.context.fillRect(IMAGE_MIN_HEIGHT - UNIT_PADDING - 2, pointerY, 1, 3)
    this.context.fillRect(IMAGE_MIN_HEIGHT - UNIT_PADDING - 1, pointerY + 1, 1, 1)
    this.context.fillStyle = COLOURS.white.main
    this.context.fillRect(UNIT_PADDING, pointerY - 2, IMAGE_MIN_HEIGHT - 2 * UNIT_PADDING - 3, 5)
    this.context.fillRect(IMAGE_MIN_HEIGHT - UNIT_PADDING - 3, pointerY - 1, 1, 3)
    this.context.fillRect(IMAGE_MIN_HEIGHT - UNIT_PADDING - 2, pointerY, 1, 1)
    this.context.restore()
    this.foreground = this.saveContextToImageSet()
  }
}
