'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseSchema = new mongoose.Schema({
    processCode: {
        type: String,
        required: true,
        trim: true,
    },
    obj: {
        type: Object,
        required: true,
    },
    refNo: {
        type: Number,
        required: true,
        trim: true,
    },
    transactionNo: {
        type: String,
        trim: true,
        required: true,
    },

    transactionLayer: {
        type: String,
        required: true,
        trim: true,
    },

    vatNumber: {
        type: String,
        required: true,
        trim: true,
    },
    response: {
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

const QrModel = mongoose.model('qrphase1', mongooseSchema);

module.exports = QrModel;
