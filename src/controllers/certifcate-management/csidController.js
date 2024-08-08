const CSIDComplianceModel = require('../../models/certificateManagement/csidCompliance');
const { mongoose } = require('mongoose');
const CSIDOnboardingModel = require('../../models/certificateManagement/csidOnBoarding');
const { default: axios } = require('axios');

const complianceCSIDGenerate = async (req, res) => {
    // let query = optionalQueryObject || {};
    // let parameterToGet = optionalQueryObject.parameterToGet || "";
    try {
        console.log(req.csr);
        const { headers, body } = req;
        // console.log('sending this postData to csidController', body);

        // Validate headers and body
        if (!headers['otp'] || !headers['accept-version']) {
            return res.status(400).json({ error: 'OTP and Accept-Version headers are required' });
        }
        if (!body.csr) {
            return res.status(400).json({ error: 'req.body.csr is missing' });
        }

        console.log('OTP IS HERE', headers.otp);
        const postData = body;
        console.log('Body IS HERE', postData);

        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance',
            postData,
            {
                headers: {
                    OTP: headers.otp,
                    'Accept-Version': headers['accept-version'],
                },
            },
        );

        const csidObject = new CSIDComplianceModel({
            certificateSigningRequest: body.csr, // it's CSR id
            requestId: response.data.requestID,
            binaryToken: response.data.binarySecurityToken,
            securityToken: response.data.binarySecurityToken,
            secretKey: response.data.secret,
        });

        const csidObjectSave = await csidObject.save();

        if (csidObjectSave) {
            res.status(200).json({ data: response.data });
        } else {
            res.status(400).json({ message: 'Failed to save CSID to the database' });
        }
    } catch (error) {
        console.error('Error making POST request:', error);
        res.status(500).json({ error: 'Internal Server Error', errorMessage: error });
    }
    // var filter = {};
    // filter = Object.assign({}, query, {
    //   "isDeletedObject.status": false,
    // });
    // query = [
    //   {
    //     $match: { ...filter },
    //   },
    // ];

    // const args = {
    //   query,
    //   parameterToGet,
    //   defaultParams,
    // };

    // const response = await genericProcedure._baseFetch(model, args, "Aggregate");

    // return response;
};

// };
const onboardingCSIDGenerate = async (req, res) => {
    try {
        const { headers, body } = req;
        if (!headers['accept-version']) {
            return res.status(400).json({ error: 'Accept-Version in headers is required' });
        }
        if (!body) {
            return res.status(400).json({ error: 'compliance_request_id in body is missing' });
        }

        const postData = body;
        const requestId = postData?.compliance_request_id;
        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/production/csids',
            {
                compliance_request_id: requestId,
            },
            {
                headers: {
                    Authorization: headers.authorization,
                    'Accept-Version': headers['accept-version'],
                },
            },
        );

        const data = new CSIDOnboardingModel({
            cryptographicStampIdentifier: postData.cryptographicStampIdentifier || '-',
            requestId: response.data.requestID,
            tokenType: response.data.tokenType,
            binaryToken: response.data.binarySecurityToken,
            secretKey: response.data.secret,
        });
        const saved = await data.save();
        if (saved) {
            res.status(200).json({ data: response.data });
        } else {
            res.status(400).json({ message: 'faild to save response', data: response.data });
        }
    } catch (error) {
        console.error('Error making POST request:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const complianceCheck = async (req, res) => {
    try {
        const { headers, body } = req;
        if (!headers['accept-version']) {
            return res.status(400).json({ error: 'Accept-Version in headers is required' });
        }
        if (!body) {
            return res.status(400).json({ error: 'Invoice data in body is missing' });
        }

        const postData = body;

        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance/invoices',
            postData,
            {
                headers: {
                    Authorization: headers.authorization,
                    'Accept-Version': headers['accept-version'],
                    'Accept-Language': headers['accept-language'],
                },
            },
        );

        res.status(200).json({ data: response.data });
    } catch (error) {
        console.error('Error making POST request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    complianceCSIDGenerate,
    onboardingCSIDGenerate,
    complianceCheck,
};
