'use strict';

const {
    getCSIDCompliance,
    getSpecificCSIDCompliance,
} = require('../../../../controllers/miscellaneous/extraTempController/csid');
const { getCSR } = require('../../../../controllers/miscellaneous/extraTempController/csr');
const {
    getOrganization,
    addOrganization,
} = require('../../../../controllers/miscellaneous/extraTempController/organization');
const OrganizationModel = require('../../../../models/miscellaneous/organization');
const { getCounterNumber } = require('../../../../utils/invoicing_controller');
const { authMiddlewear } = require("../../../middleware/authMiddlewear")

function Miscellaneous(router) {
    // cron.schedule('*/10 * * * * *', async () => {
    //     console.log('running every 10 seconds');

    // });

    router.get('/organizations', authMiddlewear, getOrganization);
    // router.get('/organizations', getOrganization);

    router.post('/add-organization', addOrganization);

    // csr

    router.get('/csr', getCSR);

    // csid

    router.get('/csidcompliance', getCSIDCompliance);

    router.get('/csidcompliance/:id', getSpecificCSIDCompliance);

    // csid
    router.get('/invoice-count', getCounterNumber);

    router.head('/test', (req, res) => {
        res.status(200).end();
    });
}

module.exports = Miscellaneous;
