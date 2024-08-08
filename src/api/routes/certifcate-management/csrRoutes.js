'use strict';

const csrGenerator = require('../../../controllers/certifcate-management/csrController');

function csrRouter(router) {
    router.post('/csr/generate', csrGenerator);
}

module.exports = csrRouter;
