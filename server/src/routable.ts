import { Router } from 'express'

export default interface Routable {
  getRouter () : Router
}
