const express = require('express');
const router = express.Router();
const { createUser, getUsers, signinUser } = require('../controllers/userController');

router.post('/signin', signinUser);
router.get('/users', getUsers);
router.post('/users', createUser);

module.exports = router;
