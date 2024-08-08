'use strict';

//Requiring Data Dictionary from Model.js
// const model = require("../../models").miscellaneousDir.compliance;
const genericProcedure = require("../../utils/util-generic-procedure");

/**
 * @param {object} defaultParams
 * @param {object} args
 **/

exports.getCompliance = async (req, res) => {
  const response = await genericProcedure._basePost(model, req.body);

  return response;
};
