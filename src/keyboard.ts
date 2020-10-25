import { strict as assert } from 'assert'
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas'
import { Router, Request, Response } from 'express'
import { RfbClient } from 'rfb2'
import GifEncoder from 'gif-encoder'
import {
  ImageSet,
  Rect,
  spreadSize,
  spreadRect,
  drawBevelled
} from './gui'
import {
  FONT_HEIGHT,
  drawText
} from './fonts'
import {
  KBD_KEY_HEIGHT,
  KBD_KEY_WIDTH,
  COLOURS
} from './config'
import Routable from './routable'

// RfbClient is missing some public APIs.
// TODO: Make a PR to update their rfbclient.d.ts
interface RfbConnection extends RfbClient {
  keyEvent(keyCode: number, isDown: number) : void
}

export interface KeyRect extends Rect {
  key: string,
  keyShifted: string,
}

export interface KeyboardImageSet<T> extends ImageSet<T> {
  row1: T[]
  row2: T[]
  row3: T[]
  row4: T[]
  row5: T[]
}

export class Keyboard implements Routable {
  static rect: Rect
  static readonly rects: KeyboardImageSet<KeyRect> = (() => {
    const rects: ImageSet<KeyRect> = {
      row1: [],
      row2: [],
      row3: [],
      row4: [],
      row5: []
    }
    let x = 0
    let y = 0
    let currentRow: KeyRect[] = rects.row1 as KeyRect[]
    let fullWidth = 0
    function key (char: string, charShifted: string | null = null, widthScale = 1) {
      const width = Math.floor(widthScale * KBD_KEY_WIDTH)
      currentRow.push({
        x: x,
        y: y,
        width,
        height: KBD_KEY_HEIGHT,
        key: char,
        keyShifted: charShifted || char
      })
      x += width
    }
    function endRow () {
      fullWidth = Math.max(fullWidth, x)
      x = 0
      y += KBD_KEY_HEIGHT
    }
    function nextRow (row: KeyRect[]) {
      endRow()
      currentRow = row
    }
    key('`', '~')
    key('1', '!')
    key('2', '@')
    key('3', '#')
    key('4', '$')
    key('5', '%')
    key('6', '^')
    key('7', '&')
    key('8', '*')
    key('9', '(')
    key('0', ')')
    key('-', '_')
    key('=', '+')
    key('BACKSPACE', null, 2)
    nextRow(rects.row2 as KeyRect[])
    key('TAB', null, 1.5)
    key('Q')
    key('W')
    key('E')
    key('R')
    key('T')
    key('Y')
    key('U')
    key('I')
    key('O')
    key('P')
    key('[', '{')
    key(']', '}')
    key('\\', '|', 1.5)
    nextRow(rects.row3 as KeyRect[])
    key('CAPS', null, 1.5)
    key('A')
    key('S')
    key('D')
    key('F')
    key('G')
    key('H')
    key('J')
    key('K')
    key('L')
    key(';', ':')
    key('\'', '"')
    key('ENTER', null, 2.5)
    nextRow(rects.row4 as KeyRect[])
    key('SHIFT', null, 2.5)
    key('Z')
    key('X')
    key('C')
    key('V')
    key('B')
    key('N')
    key('M')
    key(',')
    key('.')
    key('/')
    key('UP')
    key('SHIFT', null, 1.5)
    nextRow(rects.row5 as KeyRect[])
    key('SPACE', null, 12)
    key('LEFT')
    key('DOWN')
    key('RIGHT')
    endRow()
    Keyboard.rect = {
      x: 0,
      y: 0,
      width: fullWidth,
      height: y
    }
    return rects as KeyboardImageSet<KeyRect>
  })()

  canvas: Canvas = createCanvas(...spreadSize(Keyboard.rect))
  context: CanvasRenderingContext2D = this.canvas.getContext('2d')
  router: Router = Router()
  gifsReleased: KeyboardImageSet<Buffer>
  gifsPressed: KeyboardImageSet<Buffer>
  gifsShiftedReleased: KeyboardImageSet<Buffer>
  gifsShiftedPressed: KeyboardImageSet<Buffer>
  buttonStates: KeyboardImageSet<boolean>
  rfbConnection: RfbConnection

  constructor (rfbConnection: RfbClient) {
    this.rfbConnection = rfbConnection as RfbConnection
    const gifsReleased: ImageSet<Buffer> = {}
    const gifsPressed: ImageSet<Buffer> = {}
    const gifsShiftedReleased: ImageSet<Buffer> = {}
    const gifsShiftedPressed: ImageSet<Buffer> = {}
    const states: [ImageSet<Buffer>, boolean, boolean][] = [
      [gifsReleased, false, false],
      [gifsPressed, true, false],
      [gifsShiftedReleased, false, true],
      [gifsShiftedPressed, true, true]
    ]
    for (const [gifSet, isPressed, isShifted] of states) {
      for (const [row, rowRects] of Object.entries(Keyboard.rects)) {
        if (!Array.isArray(rowRects)) {
          continue
        }
        gifSet[row] = []
        for (const [i, rect] of rowRects.entries()) {
          drawBevelled(this.context, rect, COLOURS.grey, isPressed)
          const textX = Math.floor(rect.x + rect.width / 2)
          const textY = Math.floor(rect.y + rect.height / 2 - FONT_HEIGHT / 2)
          const key = isShifted ? rect.keyShifted : rect.key
          drawText(this.context, textX, textY, key, COLOURS.white, true)
          const imageData = this.context.getImageData(...spreadRect(rect))
          const gif = new GifEncoder(...spreadSize(rect))
          gif.writeHeader()
          gif.addFrame(imageData.data)
          gif.finish()
          const buffer = gif.read()
          assert(buffer instanceof Buffer, 'gif data should be immediately available')
          gifSet[row][i] = buffer
        }
      }
    }
    this.gifsReleased = gifsReleased as KeyboardImageSet<Buffer>
    this.gifsPressed = gifsPressed as KeyboardImageSet<Buffer>
    this.gifsShiftedReleased = gifsShiftedReleased as KeyboardImageSet<Buffer>
    this.gifsShiftedPressed = gifsShiftedPressed as KeyboardImageSet<Buffer>
    this.buttonStates = {
      row1: Keyboard.rects.row1.map(() => false),
      row2: Keyboard.rects.row2.map(() => false),
      row3: Keyboard.rects.row3.map(() => false),
      row4: Keyboard.rects.row4.map(() => false),
      row5: Keyboard.rects.row5.map(() => false)
    }
    this.router.get('/:row/:index/image.gif', (request: Request, response: Response) => {
      if (!Object.prototype.hasOwnProperty.call(this.buttonStates, request.params.row)) {
        response.status(400).send('Invalid row')
        return
      }
      const row = this.buttonStates[request.params.row] as boolean[]
      const index = parseInt(request.params.index)
      if (index < 0 || index >= row.length) {
        response.status(400).send('Out of range')
        return
      }
      const isPressed = row[index]
      if (!isPressed && !this.isShifted()) {
        response.send(this.gifsReleased[request.params.row][index])
        return
      }
      if (!isPressed && this.isShifted()) {
        response.send(this.gifsShiftedReleased[request.params.row][index])
        return
      }
      if (isPressed && !this.isShifted()) {
        response.send(this.gifsPressed[request.params.row][index])
        return
      }
      assert(isPressed && this.isShifted())
      response.send(this.gifsShiftedPressed[request.params.row][index])
    })

    this.router.get('/:row/:index/click', (request: Request, response: Response) => {
      if (!Object.prototype.hasOwnProperty.call(this.buttonStates, request.params.row)) {
        response.status(400).send('Invalid row')
        return
      }
      const row = this.buttonStates[request.params.row] as boolean[]
      const index = parseInt(request.params.index)
      if (index < 0 || index >= row.length) {
        response.status(400).send('Out of range')
        return
      }
      row[index] = !row[index]

      // Keycode might be wrong.
      const keyRectRow = Keyboard.rects[request.params.row] as KeyRect[]
      const keyCode = this.isShifted()
        ? keyRectRow[index].keyShifted.charCodeAt(0)
        : keyRectRow[index].key.charCodeAt(0)

      this.rfbConnection.keyEvent(keyCode, row[index] ? 1 : 0)
      response.redirect('back')
    })
  }

  isShifted () : boolean {
    return this.buttonStates.row4[0]
  }

  getRouter () : Router {
    return this.router
  }
}
