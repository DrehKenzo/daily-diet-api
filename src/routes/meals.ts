import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { calculateBestSequence } from '../utils/calculate-best-sequence'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createMealsBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      createdOnDate: z.string(),
      createdOnHour: z.string(),
      withinTheDiet: z.boolean(),
    })

    const { cookies, body } = request

    const { name, description, createdOnDate, createdOnHour, withinTheDiet } =
      createMealsBodySchema.parse(body)

    let { sessionId } = cookies

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      description,
      createdOnDate,
      createdOnHour,
      withinTheDiet,
    })

    return reply.status(201).send()
  })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const meals = await knex('meals').where('session_id', sessionId).select()

      return { meals }
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { cookies, params } = request
      const { id } = getMealsParamsSchema.parse(params)
      const { sessionId } = cookies

      const meal = await knex('meals')
        .where({
          session_id: sessionId,
          id,
        })
        .first()
        .delete()

      if (meal !== 1) {
        return reply.status(404).send()
      }

      return reply.status(204).send()
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { cookies, params } = request
      const { id } = getMealsParamsSchema.parse(params)
      const { sessionId } = cookies

      const meal = await knex('meals')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      return { meal }
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const getMealsBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        createdOnDate: z.string().optional(),
        createdOnHour: z.string().optional(),
        withinTheDiet: z.boolean().optional(),
      })

      try {
        const { cookies, params, body } = request
        const { sessionId } = cookies
        const { id } = getMealsParamsSchema.parse(params)
        const data = getMealsBodySchema.parse(body)

        await knex('meals')
          .where({
            session_id: sessionId,
            id,
          })
          .update(data)

        reply.status(200).send()
      } catch (error) {
        reply.status(400).send(error)
      }
    },
  )

  app.get(
    '/statistics',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      try {
        const totalMeals = await knex('meals')
          .where('session_id', sessionId)
          .count('* as count')
          .first()

        const mealsWithinTheDiet = await knex('meals')
          .where({
            session_id: sessionId,
            withinTheDiet: true,
          })
          .count('* as count')
          .first()

        const mealsOutsideTheDiet = await knex('meals')
          .where({
            session_id: sessionId,
            withinTheDiet: false,
          })
          .count('* as count')
          .first()

        const bestSequence = await calculateBestSequence(sessionId)

        const statistics = {
          totalMeals,
          mealsWithinTheDiet,
          mealsOutsideTheDiet,
          calculateBestSequence: { count: bestSequence },
        }

        reply.send({ statistics })
      } catch (error) {
        reply.status(500).send({ error: 'Internal server error' })
      }
    },
  )
}
