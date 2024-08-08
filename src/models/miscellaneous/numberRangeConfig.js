'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseSchema = new mongoose.Schema({
    documentno: {
        type: String,
        trim: true,
        required: true,
    },
    counter: {
        type: Number,
        trim: true,
        required: true,
    },
    suffix: {
        type: String,
        trim: true,
        required: true,
    },
    prefix: {
        type: String,
        trim: true,
        required: true,
    },

    isDeletedObject: {
        status: {
            type: Boolean,
            trim: true,
            default: false,
        },
        userId: {
            type: Schema.Types.ObjectId,
        },
        timestamp: {
            type: String,
        },
    },
    creuser: {
        type: Schema.Types.ObjectId,
    },
    version: {
        type: Number,
        default: 1,
    },
    dbtimestamp: {
        type: Date,
        default: Date.now(),
    },
});

const numberRangeConfigModel = mongoose.model('numberRangeConfig', mongooseSchema);

module.exports = numberRangeConfigModel;
