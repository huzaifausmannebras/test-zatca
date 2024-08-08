const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseSchema = new mongoose.Schema({
    success: {
        type: Boolean,
        required: true,
    },
    organization: {},
    organizationIdentifier: {},
    response: {},
    validity: {
        type: Date,
        trim: true,
        default: () => new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
    session: {},

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

const CSIDOnboardingModel = mongoose.model('CSIDOnboarding', mongooseSchema);

module.exports = CSIDOnboardingModel;
