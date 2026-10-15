import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.ts'

const router = Router()

router.use(authenticateToken)

router.get('/', (req, res) => {
  res.json({ message: 'get users' })
})

router.get('/:id', (req, res) => {
  res.json({ message: 'get user' })
})

router.put('/:id', (req, res) => {
  res.json({ message: 'updated user' })
})

router.delete('/:id', (req, res) => {
  res.json({ message: 'deleted user' })
})

export default router
