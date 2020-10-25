import { Size, Colour } from './gui'

export const POINTER_AXIS_PRECISION = 4
export const CURSOR_BLINK_RATE_FPS = 0.5
export const REFRESH_RATE_MS = 300
export const SCREEN_SIZE : Size = {
  width: 640,
  height: 480
}
export const UNIT_THICKNESS = 14
export const UNIT_PADDING = 2
export const IMAGE_MIN_HEIGHT = 24
export const COLOURS: { [key: string]: Colour } = {
  yellow: {
    main: '#fc9c00',
    highlight: '#fc9c00',
    shadow: '#fc9c00'
  },
  grey: {
    main: '#848484',
    highlight: '#a8a8a8',
    shadow: '#646464'
  },
  white: {
    main: '#ffffff',
    highlight: '#ffffff',
    shadow: '#000000'
  },
  black: {
    main: '#000000',
    highlight: '#ffffff',
    shadow: '#000000'
  }
}

export const MOUSE_BUTTON_WIDTH = 30
export const MOUSE_BUTTON_HEIGHT = 40
export const MOUSE_HEIGHT = 100
