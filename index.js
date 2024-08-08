'use strict';

const dirPath = __dirname + '/';
const publicDirPath = './public';
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const xmlparser = require('express-xml-bodyparser');

const { getOrganization } = require('./src/controllers/miscellaneous/extraTempController/organization');
/*--------------------CONFIG--------------------*/
const config = require(dirPath + 'config');
const geoip = require('geoip-lite');
const bodyParser = require('body-parser');

const cron = require('node-cron');
const zatca_syncing_route_calling = require('./src/utils/sync-invoicing/route-calling');

/*--------------------INCLUDE LOADERS--------------------*/
const express = require('express'),
    LoggerInstance = require(dirPath + 'loaders/logger.js');

var authpath = dirPath + 'config/authtoken.json';
console.log('Directory: ', authpath);

async function startServer() {
    const app = express();
    // added by huzaifa
    app.use(bodyParser.json({ limit: '1000mb' }));
    app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true, parameterLimit: 1000000 }));
    //
    app.use(express.json());
    app.use(xmlparser());

    app.set('trust proxy', true);

    app.use(express.json());

    // app.use(cors({ origin: "*", credentials: true }));
    // app.use(cors({ origin: "http://localhost:3000", credentials: true }));


    app.use('/pivot-media/public/images', express.static(path.join(publicDirPath, 'images')));
    app.use(morgan('combined', { stream: LoggerInstance.stream }));

    app.use((req, res, next) => {
        var geo = geoip.lookup(req.ip);

        LoggerInstance.info(
            `Country: ${geo ? geo.country : 'unknown'} \n Region:${geo ? geo.region : 'unknown'} \n City:${geo ? geo.city : 'unknown'
            } \n Metro:${geo ? geo.metro : 'unknown'}`,
        );
        next();
    });

    await require(dirPath + '/loaders')({ expressApp: app }, express);

    // '*/10 * * * * *'  Ten Second
    // */2 * * * * 2 minute
    // */3 * * * * 3 minute

    cron.schedule('*/3 * * * *', async () => {
        await zatca_syncing_route_calling();
    });

    app.listen(config.port, () => {
        LoggerInstance.info(`
            ################################################
            🛡️  Server listening on port: ${config.port} 🛡️
            ################################################
        `);
    });
}

startServer();
