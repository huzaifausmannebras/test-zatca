// utils/dbUtils.js
const mongoose = require('mongoose');

async function findOneRestricted(model, condition, organization, options = {}) {
    try {
        const fullCondition = { ...condition, organization: organization };
        return await model.findOne(fullCondition, options.projection);
    } catch (error) {
        console.error(`Error performing findOne on ${model.modelName}:`, error);
        throw error;
    }
}


async function findManyRestricted(model, condition, organization, options = {}) {
    try {
        const fullCondition = { ...condition, organization: organization };
        return await model.find(fullCondition, options.projection).sort(options.sort).limit(options.limit);
    } catch (error) {
        console.error(`Error performing findMany on ${model.modelName}:`, error);
        throw error;
    }
}

async function findAndUpdateRestricted(model, condition, update, organization, options = {}) {
    try {
        const fullCondition = { ...condition, organization: organization };
        return await model.findOneAndUpdate(fullCondition, update, { new: true, ...options });
    } catch (error) {
        console.error(`Error performing findAndUpdate on ${model.modelName}:`, error);
        throw error;
    }
}

async function deleteRestricted(model, condition, organization) {
    try {
        const fullCondition = { ...condition, organization: organization };
        return await model.deleteOne(fullCondition);
    } catch (error) {
        console.error(`Error performing delete on ${model.modelName}:`, error);
        throw error;
    }
}


async function countRestricted(model, condition, organization) {
    try {
        const fullCondition = { ...condition, organization: organization };
        return await model.countDocuments(fullCondition);
    } catch (error) {
        console.error(`Error performing count on ${model.modelName}:`, error);
        throw error;
    }
}

module.exports = {
    findOneRestricted,
    findManyRestricted,
    findAndUpdateRestricted,
    deleteRestricted,
    countRestricted
};
