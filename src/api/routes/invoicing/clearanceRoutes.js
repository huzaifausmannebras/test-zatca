'use strict';

const { invoiceClearance, getClearance } = require('../../../controllers/invoicing/clearanceController');

function clearanceRoute(router) {
    router.get('/invoice-clearance', invoiceClearance);
    router.get('/clearance/:docno?', getClearance);

}

module.exports = clearanceRoute;
