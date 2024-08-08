'use strict';

const { InvoiceXmlGenerator, getAllInvoices } = require('../../../controllers/invoicing/InvoiceXmlController.js');

function InvoiceXmlRoute(router) {
    router.post('/generate-xml', InvoiceXmlGenerator); //it will create invoice xml data object in DB
    router.get('/invoices', getAllInvoices); //it will get all invoice xml data from  DB
}

module.exports = InvoiceXmlRoute;
