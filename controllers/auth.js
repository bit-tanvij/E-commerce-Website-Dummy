const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const { error } = require('console');

const transporter = nodemailer.createTransport({
	host: "smtp-relay.sendinblue.com",
	port: 587,
	secure: false,
	auth: {
		user: 'tanvijaiswal88@gmail.com',
		pass:
			'xsmtpsib-35d0305788432d29c07a8dd120af67c089017052548d5563879df0c55d58a481-SAwLh2Ejg31R9Mvy'
	}
});

exports.getLogin = (req, res, next) => {
	let errorMessage = null;
	let successMessage = req.flash('success');
	if (successMessage.length > 0) {
		successMessage = successMessage[0];
	} else {
		successMessage = null;
	}
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		errorMessage: errorMessage,
		successMessage: successMessage,
		oldInput: { email: '', password: '' },
		validationErrors: []
	});
};

exports.postLogin = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res
			.status(422)
			.render('auth/login', {
				path: '/login',
				pageTitle: 'Login',
				errorMessage: errors.array()[0].msg,
				successMessage: null,
				oldInput: { email: email, password: password },
				validationErrors: errors.array()
			});
	}

	User.findOne({ email: email })
		.then(user => {
			if (!user) {
				return res.render('auth/login', {
					path: '/login',
					pageTitle: 'Login',
					errorMessage: 'Email Not Registered.',
					successMessage: null,
					oldInput: { email: email, password: password },
					validationErrors: [{path: 'email'}]
				});
			}
			bcrypt.compare(password, user.password)
			.then(doMatch => {
				if (doMatch) {
					req.session.isLoggedIn = true;
					req.session.user = user;
					return req.session.save(result => {
						res.redirect('/');
					});
				}
				
				res.render('auth/login', {
					path: '/login',
					pageTitle: 'Login',
					errorMessage: 'Incorrect Password! Try Again.',
					successMessage: null,
					oldInput: { email: email, password: password },
					validationErrors: [{path: 'password'}]
					});
				})
				.catch(err => {
					console.log(err);
					res.redirect('/login');
				});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpstatusCode = 500;
			return next(error);
		});
};

exports.postLogout = (req, res, next) => {
	req.session.destroy(() => {
		res.redirect('/');
	});
};

exports.getSignup = (req, res, next) => {
	let errorMessage = req.flash('error');
	if (errorMessage.length > 0) {
		errorMessage = errorMessage[0];
	} else {
		errorMessage = null;
	}
	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Signup',
		errorMessage: errorMessage,
		oldInput: {
			email: '',
			password: '',
			confirmPassword: '',
		},
		validationErrors: []
	});
};

exports.postSignup = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const confirmPassword = req.body.confirmPassword;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res
			.status(422)
			.render('auth/signup', {
				path: '/signup',
				pageTitle: 'Signup',
				errorMessage: errors.array()[0].msg,
				oldInput: { email: email, password: password, confirmPassword: confirmPassword },
				validationErrors: errors.array()
			});
	}

	return bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const user = new User({
				email: email,
				password: hashedPassword,
				cart: { items: [] }
			});
			return user.save();
		})
		.then(result => {
			return transporter.sendMail({
				to: email,
				from: 'tanvijaiswal88@gmail.com',
				subject: 'SignUp Successful',
				html: '<h1>Welcome to the shop, Explore the world...</h1>'
			});
		})
		.then(result => {
			req.flash('success', 'SignUp Successful. Please login now.');
			res.redirect('/login');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpstatusCode = 500;
			return next(error);
		});
};

exports.getReset = (req, res, next) => {
	let errorMessage = req.flash('error');
	if (errorMessage.length > 0) {
		errorMessage = errorMessage[0];
	} else {
		errorMessage = null;
	}
	res.render('auth/reset', {
		path: '/reset',
		pageTitle: 'reset',
		errorMessage: errorMessage
	});
};

exports.postReset = (req, res, next) => {
	const email = req.body.email;
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log(err);
			req.flash('error', 'An error Occured. Please Try Again.');
			return res.redirect('/reset');
		}
		const token = buffer.toString('hex');
		User.findOne({ email: email })
			.then(user => {
				if (!user) {
					req.flash('error', 'Email Not In Use.');
					return res.redirect('/reset');
				}
				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + 3600000;
				return user.save()
			})
			.then(result => {
				req.flash('success', 'Check your Email to Reset Your Password.');
				res.redirect('/login');
				transporter.sendMail({
					to: email,
					from: 'tanvijaiswal88@gmail.com',
					subject: 'Reset Password Link',
					html: `
					<p>You requested a password reset.</p>
					<p>Click this <a href ="http://localhost:3000/reset/${token}">link<a> to set a new password.</p>
					`
				});
			})
			.catch(err => {
				console.log(err);
			});
	});
};

exports.getNewPassword = (req, res, next) => {
	const token = req.params.token;
	User.findOne({
		resetToken: token,
		resetTokenExpiration: { $gt: Date.now() }
	})
		.then(user => {
			res.render('auth/new-password', {
				path: '/new-password',
				pageTitle: 'New Password',
				userId: user._id.toString(),
				passwordToken: token
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpstatusCode = 500;
			return next(error);
		});
};

exports.postNewPassword = (req, res, next) => {
	const newPassword = req.body.password;
	const userId = req.body.userId;
	const passwordToken = req.body.passwordToken;
	let resetUser;

	User.findOne({
		resetToken: passwordToken,
		resetTokenExpiration: { $gt: Date.now() },
		_id: userId
	})
		.then(user => {
			resetUser = user;
			return bcrypt.hash(newPassword, 12);
		})
		.then(hashedPassword => {
			resetUser.password = hashedPassword;
			resetUser.resetToken = undefined;
			resetUser.resetTokenExpiration = undefined;
			return resetUser.save();
		})
		.then(result => {
			req.flash('success', 'Your Password Has Been Reset Successfully.');
			res.redirect('/login');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpstatusCode = 500;
			return next(error);
		});
}