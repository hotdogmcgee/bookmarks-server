const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks)
    })
    .post(bodyParser, (req, res) => {
        const { title, rating, author } = req.body
        const id = uuid()

        if (!title) {
            logger.error(`Title is required`);
            return res
            .status(400)
            .send('Invalid data');
        }

        if (!rating) {
            logger.error(`Rating is required`);
            return res
            .status(400)
            .send('Invalid data');
        }

        if (!author) {
            logger.error(`Author is required`);
            return res
            .status(400)
            .send('Invalid data');
        }


        const bm = {
            title, rating, author, id
        }

        bookmarks.push(bm)

        logger.info(`Bookmark with id ${id} created`)

        res.status(201).location(`http://localhost:8000/bookmarks/${id}`).json(bm)


    })

bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { id } = req.params
        const bm = bookmarks.find(item => item.id == id)

        if(!bm) {
            logger.error(`Bookmark with id ${id} not found`)
            return res.status(404).send('Bookmark not found')
        }

        res.json(bm)
    })
    .delete((req, res) => {
        const { id } = req.params
        const bmIndex = bookmarks.find(item => item.id == id)

        if (bmIndex === -1) {
            logger.error(`Bookmarks with id ${id} not found.`);
            return res
            .status(404)
            .send('Not found');
        }

        bookmarks.splice(bmIndex, 1)

        logger.info(`Bookmarks with id ${id} deleted.`);
    
        res
        .status(204)
        .end();
    })

module.exports = bookmarksRouter