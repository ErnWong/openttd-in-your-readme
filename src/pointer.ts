import { EventEmitter } from 'events'
import { Router } from 'express'
import { RfbClient } from 'rfb2'
import Routable from './routable'
import Mouse from './mouse'
import { PointerXAxis, PointerYAxis } from './pointer-axis'
import { SCREEN_SIZE } from './config'

// RfbClient is missing some public APIs.
// TODO: Make a PR to update their rfbclient.d.ts
interface RfbConnection extends RfbClient {
  pointerEvent(x: number, y: number, buttons: number) : void
}

export interface PointerState {
  x: number
  y: number
  buttons: number
}

export class Pointer extends EventEmitter implements Routable {
  mouse: Mouse = new Mouse()
  pointerXAxis: PointerXAxis = new PointerXAxis()
  pointerYAxis: PointerYAxis = new PointerYAxis()
  router: Router = Router()
  x: number = Math.floor(SCREEN_SIZE.width / 2)
  y: number = Math.floor(SCREEN_SIZE.height / 2)
  rfbConnection: RfbClient
  rfbIsConnected: boolean = false

  constructor (rfbConnection: RfbClient) {
    super()
    this.rfbConnection = rfbConnection
    this.router.use('/x', this.pointerXAxis.getRouter())
    this.router.use('/y', this.pointerYAxis.getRouter())
    this.router.use('/mouse', this.mouse.getRouter())
    this.mouse.on('change', this.onButtonChange)
    this.pointerXAxis.on('move', this.onXMove)
    this.pointerYAxis.on('move', this.onYMove)
    this.rfbConnection.on('connect', this.onConnect)

    this.pointerXAxis.drawForeground(this.x)
    this.pointerYAxis.drawForeground(this.y)
    this.pointerXAxis.updateGifs()
    this.pointerYAxis.updateGifs()
  }

  private onButtonChange = () : void => {
    this.fireUpdate()
  }

  private onXMove = (x: number) : void => {
    this.x = x
    this.pointerXAxis.drawForeground(this.x)
    this.pointerXAxis.updateGifs()
    this.fireUpdate()
  }

  private onYMove = (y: number) : void => {
    this.y = y
    this.pointerYAxis.drawForeground(this.y)
    this.pointerYAxis.updateGifs()
    this.fireUpdate()
  }

  private onConnect = () : void => {
    this.rfbIsConnected = true

    // Initialise with our values
    this.fireUpdate()
  }

  fireUpdate () : void {
    if (this.rfbIsConnected) {
      const rfbConnection = this.rfbConnection as RfbConnection
      rfbConnection.pointerEvent(this.x, this.y, this.mouse.getButtonState())
    }
  }

  getRouter () : Router {
    return this.router
  }
}
