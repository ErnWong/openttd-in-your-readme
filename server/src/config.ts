import { Size, Colour } from './gui'

export const CURSOR_SIZE = 10
export const CURSOR_BLINK_RATE_FPS = 2
export const REFRESH_RATE_MS = 2000
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
  },
  brown: {
    main: '#98845x',
    highlight: '#d4bc94',
    shadow: '#68502c'
  }
}

export const MOUSE_BUTTON_WIDTH = 30
export const MOUSE_BUTTON_HEIGHT = 40
export const MOUSE_HEIGHT = 100
export const KBD_KEY_HEIGHT = 30
export const KBD_KEY_WIDTH = 30
