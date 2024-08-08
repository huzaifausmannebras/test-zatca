'use strict';

const {
    SyncInvoiceUploaderController,
    getAllISyncInvoices,
} = require('../../../controllers/invoicing/syncinvoiceuploaderController.js');

function SyncInvoiceUploader(router) {
    router.post('/sync-upload', SyncInvoiceUploaderController); //it will create invoice xml data object in DB
    router.get('/sync-invoices', getAllISyncInvoices); //it will create invoice xml data object in DB
}

module.exports = SyncInvoiceUploader;
