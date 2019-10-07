const Router = require('express').Router;

const tselController = require('./tsel.controller');

const router = new Router();

router.route('/magic-link').get(tselController.getMagicLink);
router.route('/app/login').get(tselController.loginCode);
router.route('/api/offers/filtered-offers/v3').get(tselController.apiOffersV3);
router.route('/api/buy').get(tselController.buy);
module.exports = router;
