'use strict';

/**
 *  DB Find
 *
 * @param {object} model Contain DB model of the requested Object
 * @param {object} args
 *   An object containing:
 *      -query:
 *      -parameter:
 *
 */
const dbFindOne = async (model, args) => (
    await model.findOne(args.query, args.parameterToGet)
        .then((data) => ({
            status: true,
            data
        }))
        .catch((error) => ({
            status: false,
            error
        }))
);

const dbFind = async (model, args) => (
    await model.find(args.query, args.parameterToGet)
        // .sort()
        // .limit()

        .then((data) => ({
            status: true,
            dat a
        }))
        .catch((error) => ({
            status: false,
            error
        }))
);

const dbAggregate = async (model, args) => (
    await model.aggregate(args.query)
        .then((data) => ({
            status: true,
            data
        }))
        .catch((error) => ({
            status: false,
            error
        }))
);

const dbUpdate = async (model, args) => (
    await model.update(args.query, args.updateObject, args.extra || {})
        .then((data) => ({
            status: true,
            _id: data._id,
            message: model.modelName + ' data updated successfully',
            data
        }))
        .catch((error) => ({
            status: false,
            message: 'Operation failed, error in updating ' + model.modelName, //Get Model name from model
            error
        }))
)

const dbFindAndModify = async (model, args) => (
    await model.findAndModify(args.query, args.updateObject, args.extra)
        .then((data) => ({
            status: true,
            data
        }))
        .catch((error) => ({
            status: false,
            message: 'Operation failed, error in updating ' + model.modelName, //Get Model name from model
            error
        }))
)

const defaultQueryGenerator = (defaultParameter = {}, query) => {
    let defaultQuery = {};

    delete query.parameterToGet;

    const defaultParamsKey = Object.keys(defaultParameter);

    defaultParamsKey.map((key) => {
        if (defaultParameter[key] !== undefined)
            defaultQuery[key] = defaultParameter[key];
    });


    return {
        isDefaultParams: Object.keys(defaultQuery).length ? true : false,
        query: Object.assign(defaultQuery, query)
    };
}



/**
 * Find Request Handler
 *
 * @param {object} model Contain DB model of the requested Object
 * @param {object} args
 *   An object containing:
 *      -query:
 *      -parameter:
 * @param {Boolean} methodType
 *
 */
const FetchRequest = async (model, args, methodType = 'Find') => {
    if (methodType == 'Aggregate') {
        return await dbAggregate(model, args);
    } else {
        let _defaultQueryGenerator = defaultQueryGenerator(args.defaultParams, args.query);

        args.query = _defaultQueryGenerator.query;
        let paramsDefaultKey = _defaultQueryGenerator.isDefaultParams;

        if (methodType === 'FindOne' || paramsDefaultKey)
            return await dbFindOne(model, args);
        else
            return dbFind(model, args);
    }
}

/**
 *  POST Request Handler
 *
 * @param {object} model Contain DB model of the requested Object
 * @param {object} data Contain raw data object
 *
 */

const PostRequest = async (ref, data, methodType = 'add') => {
    const modelObject = new model(data);

    if(methodType == 'set') {
        return await ref.set(data)
            .then((data) => ({
                status: true,
                message: model.modelName + ' data saved successfully',
                _id: data._id,
                data
            }))
            .catch((error) => ({
                status: false,
                error
            }));

    } else {
        return await ref.add(data)
            .then((data) => ({
                status: true,
                message: model.modelName + ' data saved successfully',
                _id: data._id,
                data
            }))
            .catch((error) => ({
                status: false,
                error
            }));
    }
}


/**
 *  PUT Request Handler
 *
 * @param {object} model Contain DB Model of the requested Object
 * @param {object} args
 *   An object containing:
 *      -query:
 *      -updateObject:
 * @param {string} methodType
 *
 */
const PutRequest = async (model, args, methodType = "update") => (
    methodType == "update" ? await dbUpdate(model, args) : methodType == "findAndModify" ? await dbFindAndModify(model, args) : null
)

/**
// * @param {object} model Contain DB Model of the requested Object
//  * @param {object} args
//  *   An object containing:
//  *      -query:
//  *      -updateObject:
//  * @param {string} methodType
 */

const AcidTransaction = async (modelOne, modelTwo, args) => {
    const transactionOptions = {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary',
        maxCommitTimeMS: 1000
    };

    const session = await mongoose.startSession();
    try {
        session.startTransaction(transactionOptions);
        //Create Section

        //

        //Update Section
        const ModelOneUpdate = await modelOne.update(args.query, args.updateObject, args.extra || {})
            .then((data) => ({
                status: true,
                _id: data._id,
                message: model.modelName + ' data updated successfully',
                data
            }))
            .catch((error) => ({
                status: false,
                message: 'Operation failed, error in updating ' + model.modelName, //Get Model name from model
                error
            }))

        const ModelTwoUpdate = await modelTwo.update(args.query, args.updateObject, args.extra || {})
            .then((data) => ({
                status: true,
                _id: data._id,
                message: model.modelName + ' data updated successfully',
                data
            }))
            .catch((error) => ({
                status: false,
                message: 'Operation failed, error in updating ' + model.modelName, //Get Model name from model
                error
            }))

        //
        await session.commitTransaction();


    }
    catch (e) {
        console.log(e, "ERROR IN TRANSCATION")
        await session.abortTransaction();
    }
    finally {
        await session.endSession();
    }
}


module.exports = {
    _baseFetch: FetchRequest,
    _basePost: PostRequest,
    _basePut: PutRequest,
    _basseTransction: AcidTransaction
    // _baseCount: CountRequest,
}