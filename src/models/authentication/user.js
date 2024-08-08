'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        trim: true,
        required: true,
    },
    organization: {
        type: Array,
        // trim: true,
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

const UsersModel = mongoose.model('users', mongooseSchema);

module.exports = UsersModel;
