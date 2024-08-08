var nodeMailer = require('nodemailer');

exports._mailConfig = (host,port,secure,auth) => {
    return nodeMailer.createTransport({
        host:host,
        port:port,
        secure:secure,
        auth:auth
    })
} 