import { CanvasRenderingContext2D } from 'canvas'
import { UNIT_THICKNESS } from './config'

export interface Colour {
  main: string,
  highlight: string,
  shadow: string
}

export function invertColour (colour: Colour) : Colour {
  return {
    main: colour.main,
    highlight: colour.shadow,
    shadow: colour.highlight
  }
}

export interface Size {
  width: number
  height: number
}

export interface Rect extends Size {
  x: number
  y: number
}

export function sizeToRect (size: Size) : Rect {
  return {
    x: 0,
    y: 0,
    width: size.width,
    height: size.height
  }
}

export function sizeOffset (size: Size, amount: number) : Size {
  return {
    width: size.width + 2 * amount,
    height: size.height + 2 * amount
  }
}

export function rectOffset (rect: Rect, amount: number) : Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + 2 * amount,
    height: rect.height + 2 * amount
  }
}

export function spreadSize (size: Size) : [number, number] {
  return [size.width, size.height]
}

export function spreadRect (rect: Rect) : [number, number, number, number] {
  return [rect.x, rect.y, rect.width, rect.height]
}

export function drawHighlight (
  context: CanvasRenderingContext2D,
  rect: Rect,
  fillStyle: string
) : void {
  context.fillStyle = fillStyle
  context.fillRect(rect.x, rect.y, rect.width, 1)
  context.fillRect(rect.x, rect.y, 1, rect.height)
}

export function drawShadow (
  context: CanvasRenderingContext2D,
  rect: Rect,
  fillStyle: string
) : void {
  context.fillStyle = fillStyle
  context.fillRect(rect.x, rect.y + rect.height - 1, rect.width, 1)
  context.fillRect(rect.x + rect.width - 1, rect.y, 1, rect.height)
}

export function drawBevelled (
  context: CanvasRenderingContext2D,
  rect: Rect,
  colour: Colour,
  isInset: boolean
) : void {
  context.save()

  context.fillStyle = colour.main
  context.fillRect(...spreadRect(rect))

  const highlighter = isInset ? drawShadow : drawHighlight
  highlighter(context, rect, colour.highlight)

  const shadower = isInset ? drawHighlight : drawShadow
  shadower(context, rect, colour.shadow)

  context.restore()
}

export function drawRidged (
  context: CanvasRenderingContext2D,
  rect: Rect,
  frameColour: Colour,
  backgroundColour: Colour
) : void {
  drawBevelled(context, rect, frameColour, false)
  drawBevelled(context, rectOffset(rect, -1), invertColour(frameColour), false)

  context.save()
  context.fillStyle = backgroundColour.main
  context.fillRect(...spreadRect(rectOffset(rect, -2)))
  context.restore()
}

export function drawWindow (
  context: CanvasRenderingContext2D,
  rect: Rect,
  frameColour: Colour,
  titleColour: Colour,
  backgroundColour: Colour
) : Rect {
  const titleRect = { ...rect, height: UNIT_THICKNESS }
  const bodyRect = { ...rect, y: UNIT_THICKNESS, height: rect.height - UNIT_THICKNESS }
  drawRidged(context, titleRect, frameColour, titleColour)
  drawRidged(context, bodyRect, frameColour, backgroundColour)
  return rectOffset(bodyRect, -2)
}

export interface ImageSet<T> {
  [index: string]: T | T[]
}
