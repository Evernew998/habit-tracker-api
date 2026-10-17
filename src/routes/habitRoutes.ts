import { Router } from 'express'
import { z } from 'zod'
import { validateBody, validateParams } from '../middleware/validation.ts'
import { authenticateToken } from '../middleware/auth.ts'
import {
  completeHabit,
  createHabit,
  deleteHabit,
  getHabitById,
  getUserHabits,
  updateHabit,
} from '../controllers/habitController.ts'

const uuidSchema = z.object({
  id: z.uuid('Invalid habit ID format'),
})

const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  targetCount: z.number().int().positive().optional(),
  tagIds: z.array(z.uuid()).optional(),
})

const updateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  targetCount: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  tagIds: z.array(z.uuid()).optional(),
})

const completeHabitSchema = z.object({
  note: z.string().optional(),
})

const router = Router()

router.use(authenticateToken)
router.get('/', getUserHabits)
router.get('/:id', validateParams(uuidSchema), getHabitById)
router.post('/', validateBody(createHabitSchema), createHabit)
router.put(
  '/:id',
  validateParams(uuidSchema),
  validateBody(updateHabitSchema),
  updateHabit,
)
router.delete('/:id', validateParams(uuidSchema), deleteHabit)

router.post(
  '/:id/complete',
  validateParams(uuidSchema),
  validateBody(completeHabitSchema),
  completeHabit,
)

export default router
