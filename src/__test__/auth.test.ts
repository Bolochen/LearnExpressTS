import supertest from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import createServer from '../utils/server'
import { v4 as uuidv4 } from 'uuid'
import { createUser } from '../services/auth.service'
import { hashing } from '../utils/hashing'

const app = createServer()

const userAdmin: any = {
  user_id: uuidv4(),
  email: 'bolotest@bolo.com',
  name: 'bolotest',
  password: `${hashing('12345')}`,
  role: 'admin'
}

const userRegular: any = {
  user_id: uuidv4(),
  email: 'bolonormal@bolo.com',
  name: 'bolonormal',
  password: `${hashing('12345')}`
}

const userAdminCreated: any = {
  email: 'boloaja@bolo.com',
  name: 'bolotest',
  password: '12345'
}

const userRegularCreated: any = {
  email: 'bolonormalaja@bolo.com',
  name: 'bolonormal',
  password: '12345'
}

const userAdminLogin: any = {
  email: 'bolotest@bolo.com',
  password: '12345'
}

const userNotExist: any = {
  email: 'bolonormal123123@bolo.com',
  password: '1234511'
}

describe('auth', () => {
  beforeAll(async () => {
    const mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
    await createUser(userAdmin)
    await createUser(userRegular)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoose.connection.close()
  })

  describe('register', () => {
    describe('create user with role admin', () => {
      it('should return 201, success create user admin', async () => {
        await supertest(app).post('/auth/register').send(userAdminCreated).expect(201)
      })
    })
    describe('create user with role regular', () => {
      it('should return 201, success create user regular', async () => {
        await supertest(app).post('/auth/register').send(userRegularCreated).expect(201)
      })
    })
  })
  describe('login', () => {
    describe('login with exist user', () => {
      it('should return 200, return access token && refresh token', async () => {
        await supertest(app).post('/auth/login').send(userAdminLogin).expect(200)
      })
    })
    describe('login with not exist user', () => {
      it('should return 422, success login failed', async () => {
        await supertest(app).post('/auth/register').send(userNotExist).expect(422)
      })
    })
  })
})
