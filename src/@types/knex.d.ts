// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      session_id?: string
      name: string
      description: string
      createdOnDate: string
      createdOnHour: string
      withinTheDiet: boolean
    }
  }
}
