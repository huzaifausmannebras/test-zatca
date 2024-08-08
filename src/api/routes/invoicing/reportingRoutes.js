'use strict';

const { invoiceReporting, getReportings } = require('../../../controllers/invoicing/reportingController');
const ReportingResponse = require('../../../models/response/reporting');
const { authMiddlewear } = require('../../middleware/authMiddlewear');

function reportingRoute(router) {
    router.get('/invoice-reporting' ,invoiceReporting);
    router.get('/add-report', invoiceReporting);
    router.get('/reporting/:docno?', authMiddlewear,getReportings);
}



module.exports = reportingRoute;
