import { knex } from '../database'

export async function calculateBestSequence(sessionId?: string) {
  const meals = await knex('meals')
    .where('session_id', sessionId)
    .orderBy(['createdOnDate', 'createdOnHour'])

  let bestSequence = 0
  let currentSequence = 0

  for (const meal of meals) {
    if (meal.withinTheDiet) {
      currentSequence++
    } else {
      if (currentSequence > bestSequence) {
        bestSequence = currentSequence
      }
      currentSequence = 0
    }
  }
  if (currentSequence > bestSequence) {
    bestSequence = currentSequence
  }

  return bestSequence
}
