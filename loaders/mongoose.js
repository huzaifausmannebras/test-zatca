'use strict';

const mongoose = require('mongoose'),
    config = require('../config');

module.exports = async () => {
    try {
        const connection = await mongoose.connect(config.databaseURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        return connection.connection.db;
    } catch (error) {
        console.log('errr in mongoose', error);
    }
};
