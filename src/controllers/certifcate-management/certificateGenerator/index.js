'use strict';

const { spawn } = require('child_process');
const multer = require('multer');
const fs = require('fs').promises;
const csrGeneratorUtilFunc = require('../../../utils/credentiolGenerator/csr_controller');
const { csidGeneratorUtilFunc } = require('../../../utils/credentiolGenerator/csid_controller');
const { complianceCheckController } = require('../../../utils/credentiolGenerator/complianceCheck');
const { onBoardingCsidController } = require('../../../utils/credentiolGenerator/onboarding_csid_controller');
const path = require('path');
const { signXML } = require('../../../utils/invoicing_controller');
const generateInvoiceJSONUtilFunc = require('../../../utils/credentiolGenerator/invoiceJsonGenerator');
const CSIDOnboardingModel = require('../../../models/certificateManagement/csidOnBoarding');
const { CreateTemplateToSign } = require('../../../utils/credentiolGenerator/create_sample_template');



//Generate Credential route is given below that manages all kind of cert generation
const generateCredential = async (req, res) => {
    try {
        const { headers, body } = req;
        // const { headers, body } = req;

        console.log("req.auth.organization", req.auth.organization)
        console.log("body.csr.organization.identifier", )
    if(req.auth.organization.organizationIdentifier != body["csr.organization.identifier"]) {

        throw new Error(`You are not able to create certificate with this vat number ${body["csr.organization.identifier"]} `)
        return
    }
        const organization = await req.auth.organization
        const otpCompliance = headers['otp-compliance'];
        const otpOnboarding = headers['otp-onboarding'];
        const AcceptVersion = headers['accept-version'];

        if ((!otpCompliance, !otpOnboarding, !AcceptVersion)) {
            throw new Error(
                'Something is missing in header, These are required => (otpCompliance, otpOnboarding,  AcceptVersion)',
            );
        }
        if (!organization) {
            throw new Error('Looks like you are not associated with any organization, faild to get organization for your user');
        }

        const csrObj = await csrGeneratorUtilFunc(body, organization);
        if (!csrObj) {
            throw new Error('csrGeneratorUtilFunc controller faild to perform');
        }

        const csidObj = await csidGeneratorUtilFunc(csrObj.csr, headers, organization);
        if (!csidObj) {
            throw new Error('csidGeneratorUtilFunc controller faild to perform');
        }

        const decodedCSID = Buffer.from(csidObj?.binaryToken, 'base64').toString('utf-8');
        if (!decodedCSID) {
            throw new Error('Faild to get the decodedCSID');
        }

        // 
        // Placing certificate in organization folder
        const certificatePath = `public/zatca-einvoicing-sdk-238-R3.3.3/Data/Certificates/${organization?.organizationIdentifier}`;
        try {
            await fs.access(certificatePath);
            await fs.writeFile(`${certificatePath}/cert.pem`, decodedCSID);
            console.log("Folder in cert already exists, Re created and file placed");
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.mkdir(certificatePath, { recursive: true });
                await fs.writeFile(`${certificatePath}/cert.pem`, decodedCSID);
                console.log('Directory created successfully at', certificatePath);
            } else {
                throw err;
            }
        }
        // await fs.writeFile(certificatePath, decodedCSID);
        // 

        const templatePath = `public/cert/${organization?.organizationIdentifier}/invoice_templates`;

        const dir = await CreateTemplateToSign(templatePath, organization.organizationIdentifier)

        if (!dir) {
            throw new Error('Faild to create invoice sample tamplate for compliance check');
        }
        console.log("dir", dir)
        // return

        for (let i = 0; i < dir.length; i++) {
            await signXML(`${templatePath}/${dir[i]}`, `${templatePath}/signed/${dir[i]}`);
            await generateInvoiceJSONUtilFunc(
                `${templatePath}/signed/${dir[i]}`,
                `${templatePath}/signed/json_${dir[i].replaceAll('.xml', '.json')}`,
            );
            const encodedjsonContent = await fs.readFile(
                `invoicestosign/signedjson/json_${dir[i].replaceAll('.xml', '.json')}`,
            );
            const jsonContent = Buffer.from(encodedjsonContent).toString('utf-8');
            await complianceCheckController(csidObj?.binaryToken, csidObj?.secretKey, JSON.parse(jsonContent));
            console.log(
                `************************************** Compliance Sign, Json & Check Processing Done On Invice => ${i + 1
                }  **************************************`,
            );
        }

        console.log(
            `************************************** Compliance Sign, Json & Check Processing Done & Saved Succeefully **************************************`,
        );

        const onboardingCSID = await onBoardingCsidController(
            csidObj?.binaryToken,
            csidObj?.secretKey,
            csidObj.requestId,
            headers,
        );
        if (!onboardingCSID) {
            throw new Error('Faild to get the OnBoarding Credential from controller (onBoardingCsidController)');
        }

        await CSIDOnboardingModel.create({
            success: true,
            organization: req.body['csr.organization.name'],
            organizationIdentifier: req.body['csr.organization.identifier'],
            response: {
                complianceCryptographicStampIdentifier: csidObj?.binaryToken,
                requestId: onboardingCSID.requestID,
                tokenType: onboardingCSID.tokenType,
                binaryToken: onboardingCSID.binarySecurityToken,
                secretKey: onboardingCSID.secret,
            },
        });
        res.status(200).json({ success: true, message: 'Onboarding credentials generated ', response: onboardingCSID });
    } catch (error) {
        if (error) {
            console.log('catch has run');
        }
        await CSIDOnboardingModel.create({
            success: false,
            organization: req.body['csr.organization.name'],
            organizationIdentifier: req.body['csr.organization.identifier'],
            response: error,
            validity: null,
        });
        res.status(400).json({
            message: 'Faild to generate Onboarding credential, server errror',
            error: error.message,
        });
        console.log(error);
    }
};

//Below Controller Is To Get Generated Credential
const getCredentials = async (req, res) => {
    try {
        const response = await CSIDOnboardingModel.find({});

        res.status(200).json({ success: true, message: 'Onboarding credentials fetched ', response: response });
    } catch (error) {
        res.status(400).json({
            message: 'internal server errror (Faild to fetch onboarding credentials)',
            error: error,
        });
        console.log(error);
    }
};



const csidGenerator = async (req, res) => {
    try {
        const { headers, body } = req;

        const csrObj = await csrGeneratorUtilFunc(req.body);

        const csidObj = await csidGeneratorUtilFunc(csrObj.csr, headers);
        if (!csidObj) {
            throw new Error('Faild to generate CSR');
        }

        if (csrObj && csidObj) {
            res.send({
                success: true,
                csr: csrObj.csr,
                csid: csidObj.binaryToken,
                requestId: csidObj.requestId,
                secretKey: csidObj.secretKey,
            });
        }
    } catch (error) {
        console.log('error in csidGenerator', error);
        res.status(500).json({ error: 'error in csidGenerator', message: error.message });
    }
};

const complianceCheck = async (req, res) => {
    const { csid, sccretkey, invoice } = req.body;
    // Simulation //  https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance/invoices
    // Developer //   https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance/invoices
    try {
        const complianceCheck = await complianceCheckController(csid, sccretkey, invoice);
        if (!complianceCheck) {
            throw new Error('Faild to Pass Invoice from check ');
        } else {
            console.log('eslse runs');
        }

        if (complianceCheck) {
            res.status(200).json({
                message: 'compliance check complete on the given invoice',
                response: complianceCheck,
            });
        }
    } catch (error) {
        console.log('error in compliance check', error);
        res.status(500).json({ error: 'error in complianceCheck', message: error.message });
    }
};

const csidOnBoardingController = async (req, res) => {
    try {
        const { headers, body } = req;
        const { csid, sccretkey, requestid } = body;
        console.log(csid, sccretkey, requestid);

        // Simulation //  https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance/invoices
        // Developer //   https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance/invoices

        const onboardingCSID = await onBoardingCsidController(csid, sccretkey, requestid, headers);
        if (!onboardingCSID) {
            throw new Error('Faild to Generate Onboarding CSID ');
        }

        if (onboardingCSID) {
            res.status(200).json({ success: true, response: onboardingCSID });
        }
    } catch (error) {
        console.log('error in csidOnBoardingController', error);
        res.status(500).json({ error: 'error in csidOnBoardingController', message: error.message });
    }
};


module.exports = { csidGenerator, complianceCheck, csidOnBoardingController, generateCredential, getCredentials };
