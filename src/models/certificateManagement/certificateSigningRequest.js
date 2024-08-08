'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Import Schema from Mongoose

const mongooseSchema = new Schema({
    csr: {
        type: String,
        trim: true,
        required: true,
    },
    privatekey: {
        type: String,
        trim: true,
        required: true,
    },
    serialNumber: {
        type: String, //mongoose.Schema.ObjectId, // Use Schema.ObjectId instead of just ObjectId
        trim: true,
        required: true,
    },
    directory: {
        CSRConfig: {
            name: {
                type: String,
                trim: true,
                required: true,
            },
            path: {
                type: String,
                trim: true,
                required: true,
            },
        },
        CSR: {
            name: {
                type: String,
                trim: true,
                required: true,
            },
            path: {
                type: String,
                trim: true,
                required: true,
            },
        },
        PAK: {
            name: {
                type: String,
                trim: true,
                required: true,
            },
            path: {
                type: String,
                trim: true,
                required: true,
            },
        },
    },
    session: {},
    status: {},
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

const CertificateSigningRequestModel = mongoose.model('certificateSigningRequest', mongooseSchema);

module.exports = CertificateSigningRequestModel;
