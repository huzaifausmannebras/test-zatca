'use strict';

const BaseRoute = require('./miscellaneous/baseRoutes');

const credentialGenerator = require('./certifcate-management/index.js');
const csrGenerator = require('./certifcate-management/csrRoutes');
const csidRouter = require('./certifcate-management/csidRoutes');
const reportingRoute = require('./invoicing/reportingRoutes');
const clearanceRoute = require('./invoicing/clearanceRoutes');
const PreInvoicing = require('./pre-invoicing/qrGeneratorRoutes');
const InvoiceXmlRoute = require('./invoicing/complianceRoutes');
const xmlEmbeddingRoute = require('./invoicing/xmlEmbeddingRoutes');
const Zatca_Invoicing_Router = require('./zatca-invoicing/zatca-invoicing');
const { _xml } = require('../../utils/util-xml');
const Miscellaneous = require('./miscellaneous/extraTempRoutes/index.js');
const Zatca_invoice_Syncing_Router = require('./zatca-sync-invoicing/zatca-sync-invoicing.js');
const SyncInvoiceUploader = require('./invoicing/syncinvoiceuploader.js');
const { getOrganization } = require('../../controllers/miscellaneous/extraTempController/organization.js');
var cron = require('node-cron');
const { default: axios } = require('axios');
const Authentication = require('./authentication/authentication.js');
const { organizationFilterPlugin } = require('../../../src/api/middleware/dataFilterPlugin');
const { default: mongoose } = require('mongoose');

module.exports = expressApplication => {
    const app = expressApplication.Router();

    mongoose.plugin(organizationFilterPlugin);
    Authentication(app)

    Zatca_Invoicing_Router(app);

    Zatca_invoice_Syncing_Router(app);

    credentialGenerator(app);

    csrGenerator(app);

    csidRouter(app);

    PreInvoicing(app);

    reportingRoute(app);

    clearanceRoute(app);

    xmlEmbeddingRoute(app); // This is for generating and embedding xml into pdf

    InvoiceXmlRoute(app); // use for saving and fetching template object

    SyncInvoiceUploader(app); // use for saving and fetching template object

    BaseRoute(app);

    Miscellaneous(app);

    return app;
};
