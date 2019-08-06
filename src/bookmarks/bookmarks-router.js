require("dotenv").config();
const path = require('path')
const xss = require("xss");
const express = require("express");
const uuid = require("uuid/v4");
const logger = require("../logger");
const BookmarksService = require("../bookmarks-service");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  rating: bookmark.rating,
  title: xss(bookmark.title),
  description: xss(bookmark.description),
  url: xss(bookmark.url),
  date_published: bookmark.date_published
});

bookmarksRouter
  .route("/bookmarks")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })

  .post(bodyParser, (req, res, next) => {
    const { title, rating, description, url } = req.body;
    const newBookmark = { title, rating, description, url };
    const id = uuid();

    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        logger.error(`${key} is required.`);
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    if (parseInt(newBookmark.rating) > 5 || parseInt(newBookmark.rating) < 1) {
      logger.error(`incorrect number rating entered`);
      return res.status(400).json({
        error: { message: "Rating must be between 1 and 5" }
      });
    }

    BookmarksService.insertBookmark(req.app.get("db"), newBookmark)
    .then(bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${bookmark.id}`))
          .json(serializeBookmark(bookmark))
      });
    // .catch(next)
    logger.info(`Bookmark with id ${id} created`);
  });

bookmarksRouter
  .route("/bookmarks/:bookmark_id")
  .all((req, res, next) => {
    BookmarksService.getById(req.app.get("db"), req.params.bookmark_id)
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: "bookmark does not exist" }
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })

  .get((req, res, next) => {
    res.json(serializeBookmark(res.bookmark));
  })

  .delete((req, res, next) => {
    const { bookmark_id } = req.params;
    BookmarksService.deleteBookmark(req.app.get("db"), bookmark_id)
      .then(numRowsAffected => {
        logger.info(`Bookmark with id ${bookmark_id} deleted.`);
        res.status(204).end();
      })
      .catch(next);
  })

  .patch(bodyParser, (req, res, next) => {

    const { title, rating, description, url } = req.body;
    const bookmarkToUpdate = { title, rating, description, url }

    
    
    //not quite what the logic is here
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
        return res.status(400).json({
            error: {
                message: `Request body must contain either 'title', 'rating', 'url' or 'description'`
            }
        })
    }

    BookmarksService.updateBookmark(
        req.app.get('db'),
        req.params.bookmark_id,
        bookmarkToUpdate
    )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
})
module.exports = bookmarksRouter;
