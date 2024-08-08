const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const syncInvoiceSchema = new mongoose.Schema({
    data: {
        type: Object,
        required: true,
    },
    createdon: {
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

const syncInvoiceModel = mongoose.model('syncInvoices', syncInvoiceSchema);

module.exports = syncInvoiceModel;
