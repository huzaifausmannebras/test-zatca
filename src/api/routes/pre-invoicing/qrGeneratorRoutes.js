'use strict';

const GetPreInvoices = require('../../../controllers/pre-invoicing/getInvoicesController');
// const qrController = require('../../../controllers/pre-invoicing/qrGeneratorController');
const generateQrPhase1 = require('../../../controllers/pre-invoicing/qrGeneratorPhase2Controller');

function PreInvoicing(router) {
    router.post('/p1-generate-qr', generateQrPhase1);
    router.get('/preinvoices/:docno?', GetPreInvoices);
}

module.exports = PreInvoicing;
