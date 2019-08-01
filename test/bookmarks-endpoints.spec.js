const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const apiKey = process.env.API_Token
const { makeBookmarksArray } = require('./bookmarks.fixtures.js')

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
                //more assertions to be made
            })
        })
    })

    describe('GET /bookmarks/:bookmark_id', () => {
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
        
    })
})