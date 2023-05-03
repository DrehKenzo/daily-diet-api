import { it, beforeAll, afterAll, beforeEach, expect, describe } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'child_process'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    await request(app.server)
      .post('/meals')
      .send({
        name: 'Jantar',
        description: 'Frango e batata doce',
        createdOnDate: '15:00',
        createdOnHour: '17/12/2022',
        withinTheDiet: true,
      })
      .expect(201)
  })

  it('should be able to list all meals', async () => {
    const createMealsResponse = await request(app.server).post('/meals').send({
      name: 'Jantar',
      description: 'Frango e batata doce',
      createdOnDate: '15:00',
      createdOnHour: '17/12/2022',
      withinTheDiet: true,
    })

    const cookies = createMealsResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Jantar',
        description: 'Frango e batata doce',
        createdOnDate: '15:00',
        createdOnHour: '17/12/2022',
        withinTheDiet: 1,
      }),
    ])
  })

  it('should be able to list a specific meal', async () => {
    const createMealsResponse = await request(app.server).post('/meals').send({
      name: 'Jantar',
      description: 'Frango e batata doce',
      createdOnDate: '15:00',
      createdOnHour: '17/12/2022',
      withinTheDiet: true,
    })

    const cookies = createMealsResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Jantar',
        description: 'Frango e batata doce',
        createdOnDate: '15:00',
        createdOnHour: '17/12/2022',
        withinTheDiet: 1,
      }),
    )
  })

  it('should be able to delete a specific meal', async () => {
    const createMealsResponse = await request(app.server).post('/meals').send({
      name: 'Jantar',
      description: 'Frango e batata doce',
      createdOnDate: '15:00',
      createdOnHour: '17/12/2022',
      withinTheDiet: true,
    })

    const cookies = createMealsResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const getMealResponse = await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(204)

    expect(getMealResponse.body.meal).toEqual(expect.objectContaining({}))
  })

  it('should be able to update a specific meal', async () => {
    const createMealsResponse = await request(app.server).post('/meals').send({
      name: 'Jantar',
      description: 'Frango e batata doce',
      createdOnDate: '15:00',
      createdOnHour: '17/12/2022',
      withinTheDiet: true,
    })

    const cookies = createMealsResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .send({
        createdOnDate: '22:00',
        createdOnHour: '25/01/2022',
      })
      .expect(200)

    const listUpdatedMealsResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(listUpdatedMealsResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Jantar',
        description: 'Frango e batata doce',
        createdOnDate: '22:00',
        createdOnHour: '25/01/2022',
        withinTheDiet: 1,
      }),
    )
  })

  it('should be possible to show meal statistics', async () => {
    const createMealsBodySchema = await request(app.server)
      .post('/meals')
      .send({
        name: 'Almoço',
        description: 'Frango e batata doce',
        createdOnDate: '12:00',
        createdOnHour: '17/12/2022',
        withinTheDiet: true,
      })

    const cookie = createMealsBodySchema.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Café da Tarde',
      description: 'Leite com cereal',
      createdOnDate: '15:00',
      createdOnHour: '18/12/2022',
      withinTheDiet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Jantar',
      description: 'Sopa de legumes',
      createdOnDate: '18:00',
      createdOnHour: '19/12/2022',
      withinTheDiet: false,
    })

    const statisticsResponse = await request(app.server)
      .get('/meals/statistics')
      .set('Cookie', cookie)

    console.log()
    expect(statisticsResponse.body.statistics).toEqual(
      expect.objectContaining({
        totalMeals: { count: 3 },
        mealsWithinTheDiet: { count: 2 },
        mealsOutsideTheDiet: { count: 1 },
        calculateBestSequence: { count: 2 },
      }),
    )
  })
})
