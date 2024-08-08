'use strict';

function BaseRoute(router) {
    router.get('/', (req, res) => {
        res.render('index', {
            title: 'Zatca'
        });
    });

    router.get('/status', (req, res) => {
        res.status(200).end();
    });
    
    router.head('/status', (req, res) => {
        res.status(200).end();
    });
}

module.exports = BaseRoute;