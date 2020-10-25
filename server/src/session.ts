import { Router } from 'express'
import rfb from 'rfb2'
import { Pointer } from './pointer'
import Screen from './screen'
import { Keyboard } from './keyboard'
import Routable from './routable'

export default class Session implements Routable {
  pointer: Pointer
  keyboard: Keyboard
  screen: Screen
  router: Router = Router()
  rfbConnection: rfb.RfbClient

  constructor () {
    console.log('Connecting to VNC...')
    this.rfbConnection = rfb.createConnection({
      host: 'openttd-client',
      port: 5901
    })

    this.rfbConnection.on('error', (error: Error) => {
      console.error(error)
    })

    this.pointer = new Pointer(this.rfbConnection)
    this.screen = new Screen(this.rfbConnection)
    this.keyboard = new Keyboard(this.rfbConnection)
    this.router.use('/pointer', this.pointer.getRouter())
    this.router.use('/screen', this.screen.getRouter())
    this.router.use('/keyboard', this.keyboard.getRouter())
  }

  getRouter () : Router {
    return this.router
  }
}
