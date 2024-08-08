'use strict';

const expressLoader = require('./express.js'),
    mongooseLoader = require('./mongoose'),
    Logger = require('./logger');

module.exports = async ({ expressApp }, express) => {
    const mongoConnection = await mongooseLoader();
    Logger.info('✌️ DB loaded and connected!');

    await expressLoader(expressApp, express);
    Logger.info('✌️ Express loaded');
};
