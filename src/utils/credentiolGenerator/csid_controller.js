const CSIDComplianceModel = require('../../models/certificateManagement/csidCompliance');
const { mongoose } = require('mongoose');
const { default: axios } = require('axios');

const csidGeneratorUtilFunc = async (csr, header, org) => {

    try {

        if (csr && header) {
            console.log("csr and headers are receiving")
        }
        // console.log("arha", csr,)
        // console.log("header", header)


        // Validate headers and body
        if (!header['otp-compliance'] || !header['accept-version']) {
            throw new Error('otp-compliance and Accept-Version is required in  header ');
        }
        if (!csr) {
            throw new Error('csr is missing in body');
        }


        // console.log("csr", csr)
        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance',
            { csr: csr },
            {
                headers: {
                    OTP: header['otp-compliance'],
                    'Accept-Version': header['accept-version'],
                    'Content-Type': 'application/json',
                },
            },
        );


        const csidObject = new CSIDComplianceModel({
            certificateSigningRequest: csr, // it's CSR id
            requestId: response.data.requestID,
            binaryToken: response.data.binarySecurityToken,
            securityToken: response.data.binarySecurityToken,
            secretKey: response.data.secret,
            organization: org._id
        });

        const csidObjectSave = await csidObject.save();

        if (csidObjectSave) {
            // console.log("csidObjectSave", csidObjectSave)
            return csidObjectSave
        } else {
            throw new Error('Failed to save CSID to the database')
        }
    } catch (error) {
        console.error('Error making POST request:', error);
        // console.log("Header", header["otp-compliance"]
        //     , header['accept-version'], "BODY",)
        throw new Error(error);
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


module.exports = {
    csidGeneratorUtilFunc,
};
