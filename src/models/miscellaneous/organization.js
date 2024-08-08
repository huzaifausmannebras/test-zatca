'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseSchema = new mongoose.Schema({
    cocode: {
        type: String,
        trim: true,
        required: true,
    },
    clientNo: {
        type: String,
        trim: true,
        required: true,
    },
    organizationIdentifier: {
        type: String,
        trim: true,
        required: true,
    },

    name: {
        type: String,
        trim: true,
        required: true,
    },
    tin: {
        type: String,
        trim: true,
        required: true,
    },
    crn: {
        type: String,
        trim: true,
        required: true,
    },

    countryName: {
        type: String,
        trim: true,
        required: true,
    },
    address: {
        type: String,
        trim: true,
        required: false,
    },
    invoiceType: {
        type: String,
        trim: true,
        required: true,
    },
    companyURL: {
        type: String,
        trim: true,
        required: true,
    },
    region: {
        type: String,
        trim: true,
        required: true,
    },
    industry: {
        type: String,
        trim: true,
        required: true,
    },
    shortname: {
        type: String,
        trim: true,
        required: true,
    },
    location: [
        {
            uuid: {
                type: String,
                trim: true,
                required: true,
            },
            retailstoreno: {
                type: String,
                trim: true,
                required: true,
            },
            retailstorestxt: {
                type: String,
                trim: true,
                required: true,
            },
            serialNumber: {
                type: String,
                trim: true,
                required: true,
            },
            organizationIdentifier: {
                type: String,
                trim: true,
                required: true,
            },
            countryName: {
                type: String,
                trim: true,
                required: true,
            },
            region: {
                type: String,
                trim: true,
                required: true,
            },
            city: {
                type: String,
                trim: true,
                required: true,
            },
            postal: {
                type: String,
                trim: true,
                required: true,
            },
            street: {
                type: String,
                trim: true,
                required: true,
            },
        },
    ],
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



const OrganizationModel = mongoose.model('organization', mongooseSchema);

module.exports = OrganizationModel;
