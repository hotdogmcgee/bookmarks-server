const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const apiKey = process.env.API_Token
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures.js')

describe.only('Bookmarks Endpoints', () => {
    let db

    before('make knex instance', () => {
        db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks_list').truncate())

    afterEach('cleanup', () => db('bookmarks_list').truncate())

    describe('GET /bookmarks', () => {
        context('Given there are not bookmarks', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/bookmarks')
                .set('Authorization', apiKey)
                .expect(200, [])
            })
        })
        context('Given there are bookmarks in the db', () => {
        const testBookmarks = makeBookmarksArray()

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks_list')
                .insert(testBookmarks)
            })
        it('responds with all bookmarks', () => {
            return supertest(app)
                .get('/bookmarks')
                .set('Authorization', apiKey)
                .expect(200, testBookmarks)
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const{ maliciousBookmark, expectedBookmark} = makeMaliciousBookmark()

            beforeEach('insert malicious bookmark,', () => {
                return db
                    .into('bookmarks_list')
                    .insert([ maliciousBookmark ])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/`)
                    .set('Authorization', apiKey)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                        expect(res.body[0].url).to.eql(expectedBookmark.url)
                    })
            })
        })
    })

    describe.only('GET /bookmarks/:bookmark_id', () => {
        context('Given there are NO bookmarks', () => {
            it(`responds with 404`, () => {
                const bookmarkId = 65647
                return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .set('Authorization', apiKey)
                .expect(404, { error: {message: "bookmark does not exist"}})
            })
        })

        context('Given there are bookmarks in the db', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_list')
                    .insert(testBookmarks)
                })
            it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', apiKey)
                    .expect(200, expectedBookmark)
                })
            })

        context(`Given an XSS attack bookmark`, () => {
            const{ maliciousBookmark, expectedBookmark} = makeMaliciousBookmark()

            beforeEach('insert malicious bookmark,', () => {
                return db
                    .into('bookmarks_list')
                    .insert([ maliciousBookmark ])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', apiKey)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                        expect(res.body.url).to.eql(expectedBookmark.url)
                    })
            })
        })
        
    })

    describe('POST /bookmarks', () => {
        it('creates an bookmark, responding with 201 and the new bookmark', function() {
            this.retries(3)
            const newBookmark = {
                title: 'new test bookmark',
                id: 20,
                url: 'www.testurl.com',
                description: 'lorem ipsum',
                rating: 4
            }
    
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', apiKey)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    console.log(res.body);
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(parseInt(res.body.rating)).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)

                })
                .then(postRes => 
                    supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
                        .set('Authorization', apiKey)
                        
                        .expect(postRes.body)
                )
                
        })


        const requiredFields = ['title', 'url', 'description', 'rating']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'new test title',
                description: 'test new description lalalal',
                url: 'www.testurl.com',
                rating: 3
            }

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newBookmark[field]

                return supertest(app)
                    .post('/bookmarks')
                    .set('Authorization', apiKey)
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body`}
                })
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const{ maliciousBookmark, expectedBookmark} = makeMaliciousBookmark()

            it('removes XSS attack description', () => {
                return supertest(app)
                    .post(`/bookmarks`)
                    .set('Authorization', apiKey)
                    .send(maliciousBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

    describe('DELETE /bookmarks/:bookmark_id', () => {
        context('Given bookmarks DO exist in db', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_list')
                    .insert(testBookmarks)
                })

            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2;
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)

                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .set('Authorization', apiKey)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                        .get(`/bookmarks`)
                        .set('Authorization', apiKey)
                        .expect(expectedBookmarks)
                    })
            })
        })

        context('Given bookmarks DO NOT exist in db', () => {
            it('responds with 404', () => {
                const bookmarkId = 12343
                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', apiKey)
                    .expect(404, { error: { message: `bookmark does not exist`}})
            })
        })
    })
})