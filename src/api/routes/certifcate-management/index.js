'use strict';
const {
    csidGenerator,
    complianceCheck,
    csidOnBoardingController,
    generateCredential,
    getCredentials,
} = require('../../../controllers/certifcate-management/certificateGenerator/index');
const { authMiddlewear } = require('../../middleware/authMiddlewear');
const credentialGenerator = router => {
    router.post('/generate-csid', csidGenerator);
    router.post('/compliance-check', complianceCheck);
    router.post('/generate-pcsid', csidOnBoardingController);

    router.post('/generate-credential', authMiddlewear, generateCredential);

    // to get all generated credentials
    router.get('/credential', getCredentials);
};

module.exports = credentialGenerator;




