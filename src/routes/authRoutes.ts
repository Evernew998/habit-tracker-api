import { Router } from 'express'
import { email, z } from 'zod'
import { validateBody } from '../middleware/validation.ts'
import { login, register } from '../controllers/authController.ts'
import { insertUserSchema } from '../db/schema.ts'

const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

const router = Router()

router.post('/register', validateBody(insertUserSchema), register)

router.post('/login', validateBody(loginSchema), login)

export default router
