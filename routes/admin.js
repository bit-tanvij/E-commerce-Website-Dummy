const path = require('path');

const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
    '/add-product',
    [
        body('title')
            .isString()
            .isLength({ min: 3 })
            .trim()
            .withMessage('Invalid Title.'),
        body('description')
            .isLength({ min: 5, max: 400 })
            .trim()
            .withMessage('Invalid InDescription.'),
        body('price')
            .isFloat()
            .withMessage('Invalid Price')
    ],
    isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
    '/edit-product',
    [
        body('title')
            .isString()
            .isLength({ min: 3 })
            .trim()
            .withMessage('Invalid Title.'),
        body('description')
            .isLength({ min: 5, max: 400 })
            .trim()
            .withMessage('Invalid InDescription.'),
        body('price')
            .isFloat()
            .withMessage('Invalid Price')
    ],
    isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
