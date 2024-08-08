// 'use strict';

// const zatca_invoicing = require('../../../controllers/zatca-invoicing/zatca-invoicing');

// function Zatca_Invoicing_Router(router) {
//     router.post('/zatca-invoicing', zatca_invoicing);
// }

// module.exports = Zatca_Invoicing_Router;

'use strict';

const express = require('express');
const expressQueue = require('express-queue');
const zatca_invoicing = require('../../../controllers/zatca-invoicing/zatca-invoicing');

// Initialize express-queue with a maximum concurrency of 1
const queue = expressQueue({ activeLimit: 1, queuedLimit: -1, });

function Zatca_Invoicing_Router(router) {
    // Use express-queue as middleware
    router.post('/zatca-invoicing', queue, async (req, res) => {
        // Log headers to verify they are being passed correctly
        console.log('Request headers:', req.headers);

        // Proceed with invoicing logic
        try {
            // Call the invoicing function with request data
            await zatca_invoicing(req, res); // Ensure you are passing req and res properly
            console.log('Job processed successfully');
        } catch (error) {
            console.error('Error processing job:', error);
            console.log('Job Faild processed successfully');
        }
    });
}

module.exports = Zatca_Invoicing_Router;
