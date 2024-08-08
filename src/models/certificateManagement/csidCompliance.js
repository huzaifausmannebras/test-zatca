'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseSchema = new mongoose.Schema({
    certificateSigningRequest: {
        type: String,
        trim: true,
        required: true,
    },
    requestId: {
        type: String,
        trim: true,
        required: true,
    },
    binaryToken: {
        type: String,
        trim: true,
        required: true,
    },
    // securityToken: {
    //     type: String,
    //     trim: true,
    //     required: true,
    // },
    secretKey: {
        type: String,
        trim: true,
        required: true,
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
    organization: {
        type: String,
        required: true,
        trim: true
    },
    dbtimestamp: {
        type: Date,
        default: Date.now(),
    },
});

const CSIDComplianceModel = mongoose.model('CSIDCompliance', mongooseSchema);

module.exports = CSIDComplianceModel;
