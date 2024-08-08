'use strict';

const { Login, Register, Logout } = require("../../../controllers/authentication/user");

function Authentication(router) {
    router.post('/login', Login);
    router.post('/register', Register);
    router.post('/logout', Logout);
    // router.get('/preinvoices', GetPreInvoices);
}

module.exports = Authentication;
