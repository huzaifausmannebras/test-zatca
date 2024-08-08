'use strict';

//Requiring Data Dictionary from Model.js
const model = require("../../models").miscellaneousDir.dataDictionary;
const genericProcedure = require('../../utils/util-generic-procedure');


/**
 *  DB Find
 *
 * @param {object} defaultParams Contain default params to be recieved from query
 * @param {object} args
 *   An object containing:
 *      -query:
 *      -parameter:
 *
 */
exports.getDataDictionary = async (defaultParams, optionalQueryObject) => {
    let query = optionalQueryObject || {};
    let parameterToGet = optionalQueryObject.parameterToGet || "";

    var filter = {};
    filter = Object.assign({}, query, {
        'isDeletedObject.status': false
    });
    query = [
        {
            $match: { ...filter }
        },
    ]

    const args = {
        query,
        parameterToGet,
        defaultParams
    };

    const response = await genericProcedure._baseFetch(model, args,'Aggregate');

    return response;
};

exports.createDataDictionary = async (req, res) => {
    const response = await genericProcedure._basePost(model, req.body);

    return response;
};

exports.updateDataDictionary = async (obj) => {
    let query = obj.query,
        updateObject = obj.updateObject;

    var args = {
        query,
        updateObject
    };

    const response = await genericProcedure._basePut(model, args);

    return response;
};