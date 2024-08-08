const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseSchema = new mongoose.Schema({
    idNo: { type: Number, required: true, unique: true },
    customerName: {
        type: String,
        required: true,
    },
    grossTotal: {
        type: String,
        required: true,
    },
    issuedDate: {
        type: String,
        required: true,
    },
    status: {
        type: String,
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

const ReportingModel = mongoose.model('reportings', mongooseSchema);

module.exports = ReportingModel;
