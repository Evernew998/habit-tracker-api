import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import db from '../db/connection.ts'
import { habits, entries, habitTags } from '../db/schema.ts'
import { eq, and, desc } from 'drizzle-orm'

export const createHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, frequency, targetCount, tagIds } = req.body
    const userId = req.user!.id

    const result = await db.transaction(async (tx) => {
      const [newHabit] = await tx
        .insert(habits)
        .values({
          userId,
          name,
          description,
          frequency,
          targetCount,
        })
        .returning()

      if (tagIds && tagIds.length > 0) {
        const habitTagValues = tagIds.map((tagId: string) => ({
          habitId: newHabit.id,
          tagId,
        }))
        await tx.insert(habitTags).values(habitTagValues)
      }

      return newHabit
    })

    return res.status(201).json({ message: 'Habit created', habit: result })
  } catch (e) {
    console.error('Create habit error: ', e)
    res.status(500).json({
      error: 'Failed to create habit',
    })
  }
}

export const getUserHabits = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id

    const userHabitsWithTags = await db.query.habits.findMany({
      where: eq(habits.userId, userId),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(habits.updatedAt)],
    })

    const habitsWithTags = userHabitsWithTags.map((habit) => ({
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined,
    }))

    return res.json({
      habits: habitsWithTags,
    })
  } catch (e) {
    console.error('Get habits error: ', e)
    res.status(500).json({
      error: 'Failed to get habits',
    })
  }
}

export const getHabitById = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.userId, userId), eq(habits.id, id)),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
        entries: {
          orderBy: [desc(entries.completionDate)],
          limit: 10,
        },
      },
    })

    if (!habit) {
      return res.status(404).json({
        error: 'Habit not found',
      })
    }

    const habitWithTags = {
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined,
    }

    return res.json({
      habit: habitWithTags,
    })
  } catch (e) {
    console.error('Get habit error:', e)
    res.status(500).json({ e: 'Failed to fetch habit' })
  }
}

export const updateHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const { tagIds, ...updates } = req.body

    const result = await db.transaction(async (tx) => {
      const [updatedHabit] = await tx
        .update(habits)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, userId)))
        .returning()

      if (!updatedHabit) {
        throw new Error('Habit not found')
      }

      if (tagIds !== undefined) {
        await tx.delete(habitTags).where(eq(habitTags.habitId, id))
        if (tagIds.length > 0) {
          const habitTagValues = tagIds.map((tagId: string) => ({
            habitId: id,
            tagId,
          }))
          await tx.insert(habitTags).values(habitTagValues)
        }
      }

      return updatedHabit
    })

    return res.json({ message: 'Habit updated', updatedHabit: result })
  } catch (e: any) {
    if (e.message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' })
    }

    console.error('Update habit error:', e)
    return res.status(500).json({ e: 'Failed to update habit' })
  }
}

export const deleteHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const [deletedHabit] = await db
      .delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning()

    if (!deletedHabit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    return res.json({
      message: 'Habit deleted successfully',
    })
  } catch (e) {
    console.error('Delete habit error:', e)
    res.status(500).json({ error: 'Failed to delete habit' })
  }
}

export const completeHabit = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const { note } = req.body

    console.log(id)

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    const [newLog] = await db
      .insert(entries)
      .values({
        habitId: id,
        completionDate: new Date(),
        note,
      })
      .returning()

    return res.status(201).json({
      message: 'Habit completed',
      log: newLog,
    })
  } catch (e) {
    console.error('Log habit completion error:', e)
    res.status(500).json({ error: 'Failed to log habit completion' })
  }
}
