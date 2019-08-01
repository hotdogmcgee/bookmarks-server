const app = require('../src/app')
//was having trouble creating global var for api key
const apiKey = process.env.API_Token

describe('App', () => {
  it('GET / responds with 200 containing "Hello, world!"', () => {
    return supertest(app)
      .get('/')
      .set('Authorization', apiKey)
      .expect(200)
  })
})