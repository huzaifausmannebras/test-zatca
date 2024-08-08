const CSIDComplianceModel = require('../../models/certificateManagement/csidCompliance');
const { mongoose } = require('mongoose');
const CSIDOnboardingModel = require('../../models/certificateManagement/csidOnBoarding');
const { default: axios } = require('axios');

const complianceCheckController = async (csid, secretkey, invoice) => {
    try {
        console.log('csid, secretkey, !invoice', csid, secretkey, invoice);

        if (!csid || !secretkey || !invoice) {
            throw new Error('To check compliance controller, These are required : csid,secretkey,invoice');
        } else {
            console.log('csid, secretkey & invoice data is received in funciton (complianceCheck)');
        }

        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance/invoices',
            invoice,
            {
                headers: {
                    'Accept-Version': 'V2',
                    Authorization: `Basic ${Buffer.from(`${csid}:${secretkey}`).toString('base64')}`,
                    'Accept-Language': 'en',
                    'Content-Type': 'application/json',
                },
            },
        );
        console.log('compliance check status', response.status);
        console.log('compliance check response', response.data);

        // console.log("see ", invoice)

        return response.data;
        // const csidObject = new CSIDComplianceModel({
        //     certificateSigningRequest: csr, // it's CSR id
        //     requestId: response.data.requestID,
        //     binaryToken: response.data.binarySecurityToken,
        //     securityToken: response.data.binarySecurityToken,
        //     secretKey: response.data.secret,
        // });

        // const csidObjectSave = await csidObject.save();

        // if (csidObjectSave) {
        //     return csidObjectSave
        // } else {
        //     throw new Error('Failed to save CSID to the database')
        // }
    } catch (error) {
        console.error('Error making POST request:', error);
        throw new Error(error);
    }
};

module.exports = {
    complianceCheckController,
};
