const express = require('express');
const {User} = require("../../model");
const router = express.Router();
const {authenticate} = require("../../middlewares");

router.get("/current", authenticate, async(req, res) => {
    const {email, subscription} = req.user;
    res.json({
        email,
        subscription
    })
});

router.get("/logout", authenticate, async(req, res) => {
    const {_id} = req.user; 
    await User.findByIdAndUpdate(_id, {token: null});
    res.status(204).send();
})

module.exports = router;
