import { Router } from 'express'
import rfb from 'rfb2'
import { Pointer } from './pointer'
import Screen from './screen'
import Routable from './routable'

export default class Session implements Routable {
  pointer: Pointer
  screen: Screen
  router: Router = Router()
  rfbConnection: rfb.RfbClient

  constructor (port: number) {
    console.log('Connecting to VNC...')
    this.rfbConnection = rfb.createConnection({
      host: '127.0.0.1',
      port: port
    })

    this.rfbConnection.on('error', (error: Error) => {
      console.error(error)
    })

    this.pointer = new Pointer(this.rfbConnection)
    this.screen = new Screen(this.rfbConnection)
    this.router.use('/pointer', this.pointer.getRouter())
    this.router.use('/screen', this.screen.getRouter())
  }

  getRouter () : Router {
    return this.router
  }
}
