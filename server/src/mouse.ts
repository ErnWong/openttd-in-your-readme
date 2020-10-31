import { strict as assert } from 'assert'
import { EventEmitter } from 'events'
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas'
import { Router, Request, Response } from 'express'
import GifEncoder from 'gif-encoder'
import {
  ImageSet,
  Rect,
  rectOffset,
  spreadSize,
  spreadRect,
  drawBevelled
} from './gui'
import {
  MOUSE_BUTTON_WIDTH,
  MOUSE_BUTTON_HEIGHT,
  MOUSE_HEIGHT,
  COLOURS
} from './config'
import Routable from './routable'

export interface MouseImageSet<T> extends ImageSet<T> {
  full: T
  left: T
  right: T
  bottom: T
}

export const BUTTONS = {
  left: 1 << 0,
  middle: 1 << 1,
  right: 1 << 2,
  wheel_up: 1 << 3,
  wheel_down: 1 << 4
}

export default class Mouse extends EventEmitter implements Routable {
  static readonly rects: MouseImageSet<Rect> = {
    full: {
      x: 0,
      y: 0,
      width: MOUSE_BUTTON_WIDTH * 2,
      height: MOUSE_HEIGHT
    },
    left: {
      x: 0,
      y: 0,
      width: MOUSE_BUTTON_WIDTH,
      height: MOUSE_BUTTON_HEIGHT
    },
    right: {
      x: MOUSE_BUTTON_WIDTH,
      y: 0,
      width: MOUSE_BUTTON_WIDTH,
      height: MOUSE_BUTTON_HEIGHT
    },
    bottom: {
      x: 0,
      y: MOUSE_BUTTON_HEIGHT,
      width: MOUSE_BUTTON_WIDTH * 2,
      height: MOUSE_HEIGHT - MOUSE_BUTTON_HEIGHT
    }
  }

  canvas: Canvas = createCanvas(...spreadSize(Mouse.rects.full))
  context: CanvasRenderingContext2D = this.canvas.getContext('2d')
  router: Router = Router()
  gifsPressed: MouseImageSet<Buffer>
  gifsReleased: MouseImageSet<Buffer>
  buttonState: number = 0

  constructor () {
    super()

    drawBevelled(this.context, Mouse.rects.left, COLOURS.grey, false)
    drawBevelled(this.context, rectOffset(Mouse.rects.left, -1), COLOURS.grey, false)
    drawBevelled(this.context, Mouse.rects.right, COLOURS.grey, false)
    drawBevelled(this.context, rectOffset(Mouse.rects.right, -1), COLOURS.grey, false)
    drawBevelled(this.context, Mouse.rects.bottom, COLOURS.grey, false)
    drawBevelled(this.context, rectOffset(Mouse.rects.bottom, -1), COLOURS.grey, false)
    this.gifsReleased = this.generateGifImageSet()

    drawBevelled(this.context, Mouse.rects.left, COLOURS.grey, true)
    drawBevelled(this.context, rectOffset(Mouse.rects.left, -1), COLOURS.grey, true)
    drawBevelled(this.context, Mouse.rects.right, COLOURS.grey, true)
    drawBevelled(this.context, rectOffset(Mouse.rects.right, -1), COLOURS.grey, true)
    this.gifsPressed = this.generateGifImageSet()

    this.router.get('/left-click', this.onLeftClick)
    this.router.get('/right-click', this.onRightClick)
    this.router.get('/left-button.gif', (_: Request, response: Response) : void => {
      response.type('image/gif')
      if (this.buttonState & BUTTONS.left) {
        response.send(this.gifsPressed.left)
      } else {
        response.send(this.gifsReleased.left)
      }
    })
    this.router.get('/right-button.gif', (_: Request, response: Response) : void => {
      response.type('image/gif')
      if (this.buttonState & BUTTONS.right) {
        response.send(this.gifsPressed.right)
      } else {
        response.send(this.gifsReleased.right)
      }
    })
    this.router.get('/mouse-grabby-part.gif', (_: Request, response: Response) : void => {
      response.type('image/gif')
      response.send(this.gifsReleased.bottom)
    })
  }

  private generateGifImageSet () : MouseImageSet<Buffer> {
    const gifSet : ImageSet<Buffer> = {}
    for (const [key, rect] of Object.entries(Mouse.rects)) {
      assert(!Array.isArray(rect))
      const imageData = this.context.getImageData(...spreadRect(rect))
      const gif = new GifEncoder(...spreadSize(rect))
      gif.writeHeader()
      gif.addFrame(imageData.data)
      gif.finish()
      const buffer = gif.read()
      assert(buffer instanceof Buffer, 'gif data should be immediately available')
      gifSet[key] = buffer
    }
    return gifSet as MouseImageSet<Buffer>
  }

  private onLeftClick = (_: Request, response: Response) : void => {
    this.buttonState ^= BUTTONS.left
    this.emit('change')
    response.redirect('back')
  }

  private onRightClick = (_: Request, response: Response) : void => {
    this.buttonState ^= BUTTONS.right
    this.emit('change')
    response.redirect('back')
  }

  getButtonState () : number {
    return this.buttonState
  }

  getRouter () : Router {
    return this.router
  }
}
