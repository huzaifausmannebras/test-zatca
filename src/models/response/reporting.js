const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportingResponseSchema = new mongoose.Schema({
    success: {
        type: Boolean,
        required: true,
    },
    ardocumentno: {
        type: String,
        required: true,
    },
    oldardocumentno: {
        type: String,
        required: true,
    },
    oldcounter: {
        type: String,
        required: true,
    },
    counter: {
        type: String,
        required: true,
    },
    transactionlayerno: {
        type: String,
        required: true,
    },
    qr: {
        type: String,
    },
    response: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    invoiceObject: {
        required: true,
        type: Object,
    },
    createdAt: {
        type: Date,
        default: Date.now,
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

const ReportingResponse = mongoose.model('ReportingResponse', reportingResponseSchema);

module.exports = ReportingResponse;
