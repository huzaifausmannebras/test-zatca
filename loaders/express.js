    'use strict';

    const path = require('path'),
        cookieParser = require('cookie-parser'),
        config = require('../config'),
        methodOverride = require('method-override'),
        cors = require('cors'),
        busboy = require('connect-busboy'),
        compression = require('compression');

    const routes = require('../src/api/routes');
    var createError = require('http-errors');

    module.exports = (expressApplication, express) => {
        const app = expressApplication;

        app.set('views', path.join(path.dirname(process.mainModule.filename), '/src/views'));
        app.set('view engine', 'ejs');

        // app.use(cors());
        // local url added
        // test
        app.use(cors({ origin: ["https://zetca-nebs.web.app", "https://zatca-production.web.app", "http://localhost:3000"], credentials: true }));


        app.use(compression());
        app.use(methodOverride());

        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use(cookieParser());

        app.use(
            busboy({
                highWaterMark: 2 * 1024 * 1024,
            }),
        );

        // Load API routes
        app.use(config.api.prefix, routes(express));

        // catch 404 and forward to error handler
        app.use(function (req, res, next) {
            const err = new Error('Not Found');
            err['status'] = 404;

            next(createError(404));
        });

        // error handler
        app.use(function (err, req, res, next) {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });

        return app;
    };
