const CSIDComplianceModel = require('../../models/certificateManagement/csidCompliance');
const { mongoose } = require('mongoose');
const CSIDOnboardingModel = require('../../models/certificateManagement/csidOnBoarding');
const { default: axios } = require('axios');

const onBoardingCsidController = async (csid, secretkey, requestid, headers) => {

    if (!csid || !secretkey || !requestid) {
        console.log("all values are required to get PCSID : (csid, secretkey, requestid)")
    }
    try {

        // Validate headers and body
        if (!headers['otp-onboarding'] || !headers['accept-version']) {
            throw new Error('otp-onboarding and Accept-Version is required in  headers ');
        }


        // console.log("csr", csr)
        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/production/csids',
            { compliance_request_id: requestid },
            {
                headers: {
                    OTP: headers['otp-onboarding'],
                    Authorization: `Basic ${Buffer.from(`${csid}:${secretkey}`).toString('base64')}`,
                    'Accept-Version': headers['accept-version'],
                    'Content-Type': 'application/json',
                },
            },
        );

        console.log("response status", response.status)
        console.log("response data", response.data)

        return response.data

    } catch (error) {
        console.error('Error making POST request:', error);
        throw new Error(error);

    }
};


module.exports = {
    onBoardingCsidController,
};
