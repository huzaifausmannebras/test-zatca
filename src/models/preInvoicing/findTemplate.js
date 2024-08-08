const { mongoose } = require('mongoose');
const Schema = mongoose.Schema;

const mongooseSchema = new mongoose.Schema({
    templateno: {
        type: String,
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
    screenname: {
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

const InvoiceQrTemplate = mongoose.model('invoiceQrTemplate', mongooseSchema);

module.exports = InvoiceQrTemplate;
