const path = require('path');

const express = require('express');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();
const { check, body } = require('express-validator');

router.get('/login', authController.getLogin);

router.post(
	'/login',
	[
		body('email')
		    .isEmail()
			.withMessage('Please Enter a Valid Email Address.')
			.normalizeEmail(),
		body('password', 'Please Enter a Valid Password containing alphabets and numbers only and of Length 6-16 character.')
		   .isLength({min: 6, max: 16})
		   .isAlphanumeric()
	],
	authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post(
	'/signup',
	[
		check('email')
			.isEmail()
			.withMessage('Please Enter a Valid Email')
			.normalizeEmail()
			.custom((value, { req }) => {
				return User
					.findOne({ email: value })
					.then(userDoc => {
						if (userDoc) {
							return Promise.reject('Email Already in Use. Choose a Different Email.');
						}
					});
			}),

		body('password', 'Password length should be between 6-16 character and contain alphabets and numbers only.')
			.isLength({ min: 6, max: 16 })
			.isAlphanumeric(),

		body('confirmPassword')
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error('Password and Confirm Password Do Not Match. Try Again.');
				}
				return true;
			})
	],
	authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;