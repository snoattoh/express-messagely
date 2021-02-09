const Router = require("express").Router;
const Message = require("../models/message");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", 
ensureLoggedIn, //We don't use the username in this route, so we need to check outside of middleware whether or not the user is correct
async (req, res, next) => {
    try {
      const result = await Message.get(req.params.id);
      if((result.from_user.username || result.to_user.username) === req.user.username) return res.json({message: result});
    }
    catch (err) {
      return next(err);
    }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

 
router.post("/",
ensureLoggedIn,
async (req, res, next) => {
    try {
      const result = await Message.create(req.user.username, req.body.to_username, req.body.body);
      return res.json({message: result});
    } catch (err) {
      return next(err);
    }
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/",
ensureLoggedIn,
async (req, res, next) => {
    try {
      const message = await Message.get(req.params.id);
      if((message.to_user.username) === req.user.username){
        const result = await Message.markRead(req.user.username, req.body.to_username, req.body.body);
        return res.json({message: result});
        } 
      }catch (err) {
        return next(err);
    }
});

