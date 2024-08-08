'use strict';

const zatca_sync_invoicing = require('../../../controllers/zatca-sync-invoicing/zatca-sync-invoicing');

const Zatca_invoice_Syncing_Router = router => {
    router.post('/zatca-syncing', zatca_sync_invoicing);
};

module.exports = Zatca_invoice_Syncing_Router;
