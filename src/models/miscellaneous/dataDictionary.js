'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const detailObject = new mongoose.Schema({
    tag: { 
        type: String, 
        required: true 
    },
    order: { 
        type: String, 
        required: true 
    },
    format: { 
        type: String, 
        required: true 
    },
    label: { 
        type: String, 
        required: true 
    },
    mapId: { 
        type: String, 
        required: true 
    },
});

const dataDictionary = new Schema({
    templateNo: {
        type: Number,
        required: true,
    },
    processcode: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    dataDictionary: {
        type: [detailObject],
        default: undefined,
    },
    isDeletedObject: {
        status: {
            type: Boolean,
            trim: true,
            default: false,
        },
        timestamp: {
            type: Date,
        },
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

const dataDictionaryModel = mongoose.model('dataDictionary', dataDictionary);

exports.dataDictionaryModel = dataDictionaryModel;