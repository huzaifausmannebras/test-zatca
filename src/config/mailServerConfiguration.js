var nodeMailer = require('nodemailer');

var mailConfig = nodeMailer.createTransport({
    host: "gator3109.hostgator.com", // hostname
    // secureConnection: false, // TLS requires secureConnection to be false
    port: 465, // port for secure SMTP
    secure: true,
    auth: {
        user: 'no-reply@learnoda.com',
        pass: 'lErn%^o2023'
    }
});

module.exports = {
    '_mailConfig': mailConfig
};      