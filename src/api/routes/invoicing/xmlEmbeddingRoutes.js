'use strict';

const { xmlEmbedding } = require('../../../controllers/invoicing/xmlEmbeddingController.js');
const { authMiddlewear } = require('../../middleware/authMiddlewear.js');

function xmlEmbeddingRoute(router) {
    router.post('/embed-xml',authMiddlewear ,xmlEmbedding); //it will create invoice xml data object in DB
}

module.exports = xmlEmbeddingRoute;
