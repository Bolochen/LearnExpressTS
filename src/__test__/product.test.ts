import supertest from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import createServer from '../utils/server'
import { addProductToDB } from '../services/product.service'
import { v4 as uuidv4 } from 'uuid'
import { createUser } from '../services/auth.service'
import { hashing } from '../utils/hashing'

const app = createServer()

const productPayload: any = {
  product_id: uuidv4(),
  name: 'KAOS VIP CODE STUDIO',
  price: '100000',
  size: 'XL'
}

const productPayloadCreate: object = {
  product_id: uuidv4(),
  name: 'KAOS VIP CODE STUDIO baru',
  price: '100000',
  size: 'XL'
}

const productPayloadUpdate: any = {
  price: '200000',
  size: 'XXL'
}

const userAdminCreated: any = {
  user_id: uuidv4(),
  email: 'bolotest@bolo.com',
  name: 'bolotest',
  password: `${hashing('12345')}`,
  role: 'admin'
}

const userCreated: any = {
  user_id: uuidv4(),
  email: 'bolonormal@bolo.com',
  name: 'bolonormal',
  password: `${hashing('12345')}`
}

const userAdmin: any = {
  email: 'bolotest@bolo.com',
  password: '12345'
}

const userRegular: any = {
  email: 'bolonormal@bolo.com',
  password: '12345'
}

describe('product', () => {
  beforeAll(async () => {
    const mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
    await addProductToDB(productPayload)
    await createUser(userAdminCreated)
    await createUser(userCreated)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoose.connection.close()
  })

  describe('get all product', () => {
    describe('given the product does exist', () => {
      it('should return 200', async () => {
        const { statusCode } = await supertest(app).get('/product')
        expect(statusCode).toBe(200)
      })
    })
  })

  describe('get detail product', () => {
    describe('given the product does not exist', () => {
      it('should return 404, and empty data', async () => {
        const productId = 'PRODUCT_123'
        await supertest(app).get(`/product/${productId}`).expect(404)
      })
      describe('given the product does exist', () => {
        it('should return 200, and detail product data', async () => {
          const { statusCode, body } = await supertest(app).get(`/product/${productPayload.product_id}`)
          expect(statusCode).toBe(200)
          expect(body.data.name).toBe('KAOS VIP CODE STUDIO')
        })
      })
    })
  })

  describe('create product', () => {
    describe('if user is not login', () => {
      it('should return 403, request forbidden', async () => {
        const { statusCode } = await supertest(app).post('/product').send(productPayloadCreate)
        expect(statusCode).toBe(403)
      })
    })
    describe('if user is login as admin', () => {
      it('should return 201, success create product', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userAdmin)
        await supertest(app)
          .post('/product')
          .set('Authorization', `Bearer ${body.data.accessToken}`)
          .send(productPayloadCreate)
          .expect(201)
      })
      it('should return 422, product name is exist in db', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userAdmin)
        await supertest(app)
          .post('/product')
          .set('Authorization', `Bearer ${body.data.accessToken}`)
          .send(productPayload)
          .expect(422)
      })
    })
    describe('if user is login as regular', () => {
      it('should return 403, request forbidden', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userRegular)
        const { statusCode } = await supertest(app)
          .post('/product')
          .set('Authorization', `Bearer ${body.data.accessToken}`)
          .send(productPayloadCreate)
        expect(statusCode).toBe(403)
      })
    })
  })

  describe('update product', () => {
    describe('if user is not login', () => {
      it('should return 403, request forbidden', async () => {
        const { statusCode } = await supertest(app).put(`/product/${productPayload.product_id}`)
        expect(statusCode).toBe(403)
      })
    })
    describe('if user is login as admin', () => {
      it('should return 200, success update product', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userAdmin)
        await supertest(app)
          .put(`/product/${productPayload.product_id}`)
          .set('Authorization', `Bearer ${body.data.accessToken}`)
          .send(productPayloadUpdate)
          .expect(200)

        const updatedData = await supertest(app).get(`/product/${productPayload.product_id}`)
        expect(updatedData.body.data.size).toBe('XXL')
        expect(updatedData.body.data.price).toBe(200000)
      })
      it('should return 404, product does not exist in db', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userAdmin)
        await supertest(app)
          .put('/product/product_123')
          .set('Authorization', `Bearer ${body.data.accessToken}`)
          .expect(404)
      })
    })
    describe('if user is login as regular', () => {
      it('should return 403, request forbidden', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userRegular)
        const { statusCode } = await supertest(app)
          .put(`/product/${productPayload.product_id}`)
          .set('Authorization', `Bearer ${body.data.accessToken}`)
          .send(productPayloadUpdate)
        expect(statusCode).toBe(403)
      })
    })
  })

  describe('delete product', () => {
    describe('if user is not login', () => {
      it('should return 403, request forbidden', async () => {
        const { statusCode } = await supertest(app).delete(`/product/${productPayload.product_id}`)
        expect(statusCode).toBe(403)
      })
    })
    describe('if user is login as admin', () => {
      it('should return 200, success delete product', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userAdmin)
        await supertest(app)
          .delete(`/product/${productPayload.product_id}`)
          .set('Authorization', `Bearer ${body.data.accessToken}`)
          .expect(200)
      })
      it('should return 404, product does not exist in db', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userAdmin)
        await supertest(app)
          .delete('/product/product_123')
          .set('Authorization', `Bearer ${body.data.accessToken}`)
          .expect(404)
      })
    })
    describe('if user is login as regular', () => {
      it('should return 403, request forbidden', async () => {
        const { body } = await supertest(app).post('/auth/login').send(userRegular)
        const { statusCode } = await supertest(app)
          .delete(`/product/${productPayload.product_id}`)
          .set('Authorization', `Bearer ${body.data.accessToken}`)
        expect(statusCode).toBe(403)
      })
    })
  })
})
