const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataDictionary = new mongoose.Schema({
    tag: {
        type: String,
        required: true,
    },
    order: {
        type: String,
        required: true,
    },
    format: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        required: true,
    },
    mapId: {
        type: Array,
        required: true,
    },
});

const mongooseSchema = new mongoose.Schema({
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
    // dataDictionary: { type: [dataDictionary], required: false },
});

const InvoiceXmlModel = mongoose.model('Invoice', mongooseSchema);

module.exports = InvoiceXmlModel;
