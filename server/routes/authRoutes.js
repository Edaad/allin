const express = require('express');
const router = express.Router();
const { createUser, signinUser } = require('../controllers/userController');

router.post('/signup', createUser);
router.post('/signin', signinUser);

module.exports = router;
