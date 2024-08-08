'use strict';

const {
    complianceCSIDGenerate,
    onboardingCSIDGenerate,
    complianceCheck,
} = require('../../../controllers/certifcate-management/csidController');

const csidRouter = router => {
    router.post('/compliance/csid', complianceCSIDGenerate);
    router.post('/onBoarding/csid', onboardingCSIDGenerate);
    router.get('/compliance/check', complianceCheck);
};

module.exports = csidRouter;