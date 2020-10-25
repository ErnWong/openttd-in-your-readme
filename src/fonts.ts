import { strict as assert } from 'assert'
import fs from 'fs'
import { join } from 'path'
import {
  createCanvas,
  Image,
  CanvasRenderingContext2D,
  ImageData
} from 'canvas'
import {
  Size,
  Colour,
  spreadSize
} from './gui'

const FONT_SPRITE_PATH = join(__dirname, '../opengfx/sprites/png/gui/fonts.png')

interface Glyph extends Size {
  offsetX: number
  offsetY: number
  main: ImageData
  shadow: ImageData
}

/* eslint-disable array-bracket-spacing */
/* eslint-disable no-multi-spaces */
const SPRITE_INFO = [
  [  10,   10,   2,  13,   0,  -2],
  [  30,   10,   3,  13,   0,  -2],
  [  50,   10,   5,  13,   0,  -2],
  [  70,   10,  10,  13,   0,  -2],
  [  90,   10,   9,  13,   0,  -2],
  [ 110,   10,  12,  13,   0,  -2],
  [ 130,   10,   9,  13,   0,  -2],
  [ 150,   10,   3,  13,   0,  -2],
  [ 170,   10,   5,  13,   0,  -2],
  [ 190,   10,   5,  13,   0,  -2],
  [ 210,   10,   7,  13,   0,  -2],
  [ 230,   10,   7,  13,   0,  -2],
  [ 250,   10,   3,  13,   0,  -2],
  [ 270,   10,   5,  13,   0,  -2],
  [ 290,   10,   3,  13,   0,  -2],
  [ 310,   10,   5,  13,   0,  -2],
  [ 330,   10,   7,  13,   0,  -2],
  [ 350,   10,   7,  13,   0,  -2],
  [ 370,   10,   7,  13,   0,  -2],
  [ 390,   10,   7,  13,   0,  -2],
  [ 410,   10,   7,  13,   0,  -2],
  [ 430,   10,   7,  13,   0,  -2],
  [ 450,   10,   7,  13,   0,  -2],
  [ 470,   10,   7,  13,   0,  -2],
  [ 490,   10,   7,  13,   0,  -2],
  [ 510,   10,   7,  13,   0,  -2],
  [ 530,   10,   3,  13,   0,  -2],
  [ 550,   10,   3,  13,   0,  -2],
  [ 570,   10,   7,  13,   0,  -2],
  [ 590,   10,   7,  13,   0,  -2],
  [ 610,   10,   7,  13,   0,  -2],
  [ 630,   10,   7,  13,   0,  -2],
  [ 650,   10,  11,  13,   0,  -2],
  [ 670,   10,   9,  13,   0,  -2],
  [ 690,   10,   8,  13,   0,  -2],
  [ 710,   10,   9,  13,   0,  -2],
  [ 730,   10,   8,  13,   0,  -2],
  [ 750,   10,   8,  13,   0,  -2],
  [ 770,   10,   8,  13,   0,  -2],
  [  10,   70,   9,  13,   0,  -2],
  [  30,   70,   8,  13,   0,  -2],
  [  50,   70,   3,  13,   0,  -2],
  [  70,   70,   7,  13,   0,  -2],
  [  90,   70,   8,  13,   0,  -2],
  [ 110,   70,   7,  13,   0,  -2],
  [ 130,   70,   9,  13,   0,  -2],
  [ 150,   70,   8,  13,   0,  -2],
  [ 170,   70,   9,  13,   0,  -2],
  [ 190,   70,   8,  13,   0,  -2],
  [ 210,   70,   9,  13,   0,  -2],
  [ 230,   70,   8,  13,   0,  -2],
  [ 250,   70,   8,  13,   0,  -2],
  [ 270,   70,   9,  13,   0,  -2],
  [ 290,   70,   8,  13,   0,  -2],
  [ 310,   70,   9,  13,   0,  -2],
  [ 330,   70,  12,  13,   0,  -2],
  [ 350,   70,   9,  13,   0,  -2],
  [ 370,   70,   9,  13,   0,  -2],
  [ 390,   70,   8,  13,   0,  -2],
  [ 410,   70,   4,  13,   0,  -2],
  [ 430,   70,   5,  13,   0,  -2],
  [ 450,   70,   4,  13,   0,  -2],
  [ 470,   70,   6,  13,   0,  -2],
  [ 490,   70,   8,  13,   0,  -2],
  [ 510,   70,   4,  13,   0,  -2],
  [ 530,   70,   7,  13,   0,  -2],
  [ 550,   70,   6,  13,   0,  -2],
  [ 570,   70,   6,  13,   0,  -2],
  [ 590,   70,   6,  13,   0,  -2],
  [ 610,   70,   6,  13,   0,  -2],
  [ 630,   70,   5,  13,   0,  -2],
  [ 650,   70,   6,  13,   0,  -2],
  [ 670,   70,   6,  13,   0,  -2],
  [ 690,   70,   3,  13,   0,  -2],
  [ 710,   70,   4,  13,   0,  -2],
  [ 730,   70,   7,  13,   0,  -2],
  [ 750,   70,   3,  13,   0,  -2],
  [ 770,   70,   9,  13,   0,  -2],
  [  10,  130,   6,  13,   0,  -2],
  [  30,  130,   6,  13,   0,  -2],
  [  50,  130,   6,  13,   0,  -2],
  [  70,  130,   6,  13,   0,  -2],
  [  90,  130,   5,  13,   0,  -2],
  [ 110,  130,   6,  13,   0,  -2],
  [ 130,  130,   5,  13,   0,  -2],
  [ 150,  130,   6,  13,   0,  -2],
  [ 170,  130,   7,  13,   0,  -2],
  [ 190,  130,  10,  13,   0,  -2],
  [ 210,  130,   7,  13,   0,  -2],
  [ 230,  130,   7,  13,   0,  -2],
  [ 250,  130,   7,  13,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 270,  130,   1,   1,   0,  -2],
  [ 290,  130,   9,  13,   0,  -2],
  [ 310,  130,   9,  13,   0,  -2],
  [ 330,  130,   3,  13,   0,  -2],
  [ 350,  130,   6,  13,   0,  -2],
  [ 370,  130,   8,  13,   0,  -2],
  [ 390,  130,   7,  13,   0,  -2],
  [ 410,  130,   9,  13,   0,  -2],
  [ 430,  130,   3,  13,   0,  -2],
  [ 450,  130,   7,  13,   0,  -2],
  [ 470,  130,   6,  13,   0,  -2],
  [ 490,  130,  10,  13,   0,  -2],
  [ 510,  130,   9,  13,   0,  -2],
  [ 530,  130,   8,  13,   0,  -2],
  [ 550,  130,  12,  13,   0,  -2],
  [ 570,  130,   8,  13,   1,  -2],
  [ 590,  130,  10,  13,   0,  -2],
  [ 610,  130,   5,  13,   0,  -2],
  [ 630,  130,   6,  13,   0,  -2],
  [ 650,  130,   7,  13,   0,  -2],
  [ 670,  130,   5,  13,   0,  -2],
  [ 690,  130,   5,  13,   0,  -2],
  [ 710,  130,  13,  13,   0,  -2],
  [ 730,  130,  13,  13,   0,  -2],
  [ 750,  130,  13,  13,   0,  -2],
  [ 770,  130,  13,  13,   0,  -2],
  [  10,  190,  13,  13,   0,  -2],
  [  30,  190,   9,  13,   0,  -2],
  [  50,  190,   6,  13,   0,  -2],
  [  70,  190,   8,  13,   0,  -2],
  [  90,  190,   7,  13,   0,  -2],
  [ 110,  190,   7,  13,   0,  -2],
  [ 130,  190,  12,  13,   0,  -2],
  [ 150,  190,   7,  13,   0,  -2],
  [ 170,  190,   9,  13,   0,  -2],
  [ 190,  190,   9,  13,   0,  -2],
  [ 210,  190,   9,  13,   0,  -2],
  [ 230,  190,   9,  13,   0,  -2],
  [ 250,  190,   9,  13,   0,  -2],
  [ 270,  190,   9,  13,   0,  -2],
  [ 290,  190,  12,  13,   0,  -2],
  [ 310,  190,   9,  13,   0,  -2],
  [ 330,  190,   8,  13,   0,  -2],
  [ 350,  190,   8,  13,   0,  -2],
  [ 370,  190,   8,  13,   0,  -2],
  [ 390,  190,   8,  13,   0,  -2],
  [ 410,  190,   4,  13,   0,  -2],
  [ 430,  190,   4,  13,   0,  -2],
  [ 450,  190,   6,  13,   0,  -2],
  [ 470,  190,   6,  13,   0,  -2],
  [ 490,  190,   9,  13,   0,  -2],
  [ 510,  190,   8,  13,   0,  -2],
  [ 530,  190,   9,  13,   0,  -2],
  [ 550,  190,   9,  13,   0,  -2],
  [ 570,  190,   9,  13,   0,  -2],
  [ 590,  190,   9,  13,   0,  -2],
  [ 610,  190,   9,  13,   0,  -2],
  [ 630,  190,   7,  13,   0,  -2],
  [ 650,  190,   9,  13,   0,  -2],
  [ 670,  190,   8,  13,   0,  -2],
  [ 690,  190,   8,  13,   0,  -2],
  [ 710,  190,   8,  13,   0,  -2],
  [ 730,  190,   8,  13,   0,  -2],
  [ 750,  190,   9,  13,   0,  -2],
  [ 770,  190,   8,  13,   0,  -2],
  [  10,  250,   7,  13,   0,  -2],
  [  30,  250,   7,  13,   0,  -2],
  [  50,  250,   7,  13,   0,  -2],
  [  70,  250,   7,  13,   0,  -2],
  [  90,  250,   7,  13,   0,  -2],
  [ 110,  250,   7,  13,   0,  -2],
  [ 130,  250,   7,  13,   0,  -2],
  [ 150,  250,   9,  13,   0,  -2],
  [ 170,  250,   6,  13,   0,  -2],
  [ 190,  250,   6,  13,   0,  -2],
  [ 210,  250,   6,  13,   0,  -2],
  [ 230,  250,   6,  13,   0,  -2],
  [ 250,  250,   6,  13,   0,  -2],
  [ 270,  250,   4,  13,   0,  -2],
  [ 290,  250,   4,  13,   0,  -2],
  [ 310,  250,   6,  13,   0,  -2],
  [ 330,  250,   6,  13,   0,  -2],
  [ 350,  250,   6,  13,   0,  -2],
  [ 370,  250,   6,  13,   0,  -2],
  [ 390,  250,   6,  13,   0,  -2],
  [ 410,  250,   6,  13,   0,  -2],
  [ 430,  250,   6,  13,   0,  -2],
  [ 450,  250,   6,  13,   0,  -2],
  [ 470,  250,   6,  13,   0,  -2],
  [ 490,  250,   7,  13,   0,  -2],
  [ 510,  250,   7,  13,   0,  -2],
  [ 530,  250,   6,  13,   0,  -2],
  [ 550,  250,   6,  13,   0,  -2],
  [ 570,  250,   6,  13,   0,  -2],
  [ 590,  250,   6,  13,   0,  -2],
  [ 610,  250,   7,  13,   0,  -2],
  [ 630,  250,   6,  13,   0,  -2],
  [ 650,  250,   7,  13,   0,  -2]
]
/* eslint-enable no-multi-spaces */
/* eslint-enable array-bracket-spacing */

export const FONT_HEIGHT = 13
const font: Map<string, Glyph> = new Map()

function loadFont () {
  console.log('Loading font')

  const spriteBuffer = fs.readFileSync(FONT_SPRITE_PATH)
  const spriteSet = new Image()
  spriteSet.src = spriteBuffer
  for (const [i, [x, y, width, height, offsetX, offsetY]] of SPRITE_INFO.entries()) {
    const character = String.fromCharCode(i + 32)
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')
    context.drawImage(spriteSet, x, y, width, height, 0, 0, width, height)
    const mainData = context.getImageData(0, 0, width, height)
    const shadowData = context.getImageData(0, 0, width, height)
    for (let i = 0; i < mainData.data.length; i += 4) {
      const red = mainData.data[i]
      const green = mainData.data[i + 1]
      const blue = mainData.data[i + 2]
      if (red === 238 && blue === 238 && green === 0) {
        mainData.data[i + 0] = 0xFF
        mainData.data[i + 1] = 0xFF
        mainData.data[i + 2] = 0xFF
        mainData.data[i + 3] = 0xFF
      } else {
        mainData.data[i + 0] = 0x00
        mainData.data[i + 1] = 0x00
        mainData.data[i + 2] = 0x00
        mainData.data[i + 3] = 0x00
      }
      if (red === 239 && blue === 239 && green === 0) {
        shadowData.data[i + 0] = 0xFF
        shadowData.data[i + 1] = 0xFF
        shadowData.data[i + 2] = 0xFF
        shadowData.data[i + 3] = 0xFF
      } else {
        shadowData.data[i + 0] = 0x00
        shadowData.data[i + 1] = 0x00
        shadowData.data[i + 2] = 0x00
        shadowData.data[i + 3] = 0x00
      }
    }
    font.set(character, {
      offsetX,
      offsetY,
      width,
      height,
      main: mainData,
      shadow: shadowData
    })
  }
  console.log('Font loaded')
}

loadFont()

export function drawText (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  colour: Colour,
  center: boolean
) {
  assert(text.length > 0)

  // Retrieve glyph information.
  const glyphs: Glyph[] = []
  let width = 0
  for (const character of text) {
    assert(font.has(character), `Font is missing character '${character}'`)
    const glyph = font.get(character) as Glyph
    // console.log(character, glyph)
    glyphs.push(glyph)
    width += glyph.width
  }

  // Setup staging canvases.
  const mainCanvas = createCanvas(width, FONT_HEIGHT)
  const mainContext = mainCanvas.getContext('2d')
  const shadowCanvas = createCanvas(width, FONT_HEIGHT)
  const shadowContext = shadowCanvas.getContext('2d')

  // Draw text masks.
  let textX = 0
  for (const glyph of glyphs) {
    mainContext.putImageData(glyph.main, textX + glyph.offsetX, glyph.offsetY)
    shadowContext.putImageData(glyph.shadow, textX + glyph.offsetX, glyph.offsetY)
    textX += glyph.width
  }

  // Fill in the colour.
  mainContext.globalCompositeOperation = 'source-in'
  shadowContext.globalCompositeOperation = 'source-in'
  mainContext.fillStyle = colour.main
  shadowContext.fillStyle = colour.shadow
  mainContext.fillRect(0, 0, ...spreadSize(mainCanvas))
  shadowContext.fillRect(0, 0, ...spreadSize(shadowCanvas))

  // Draw onto destination context.
  const leftX = center ? Math.floor(x - width / 2) : x
  context.drawImage(shadowCanvas, leftX, y)
  context.drawImage(mainCanvas, leftX, y)
}
