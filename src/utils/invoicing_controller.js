const { default: axios } = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');

const CertificateSigningRequestModel = require('../models/certificateManagement/certificateSigningRequest');
const CSIDComplianceModel = require('../models/certificateManagement/csidCompliance');
const OrganizationModel = require('../models/miscellaneous/organization');
const CSIDOnboardingModel = require('../models/certificateManagement/csidOnBoarding');
const numberRangeConfigModel = require('../models/miscellaneous/numberRangeConfig');
const { saveReporting } = require('./data_saving/reportingResponse');
const { CLIENT_RENEG_LIMIT } = require('tls');
// const generatePhaseTwoQr = require('./generatePhaseTwoQr');
const getOrganizationData = async invoice => {
    // console.log("org invoice", invoice)
    try {
        const organizationData = await OrganizationModel.findOne(
            {
                cocode: invoice?.cocode,
                'location.retailstoreno': invoice?.cocode == '0101' ? '01' : '02',
            },
            {
                cocode: 1,
                clientNo: 1,
                organizationIdentifier: 1,
                commonName: 1,
                serialNumber: 1,
                location: { $elemMatch: { retailstoreno: invoice?.cocode == '0101' ? '01' : '02' } },
            },
        );
        {
            organizationData && console.log('Organization  Fetched');
        }
        return organizationData;
    } catch (error) {
        console.log('Error fetching organization data', error);
    }
};

const ConfigureCertificate = async (organization) => {
    try {

        console.log(organization.organizationIdentifier);

        const content = `{	"xsdPath" : "C:\\\\Office\\\\zatca-api\\\\public\\\\zatca-einvoicing-sdk-238-R3.3.3\\\\Data\\\\Schemas\\\\xsds\\\\UBL2.1\\\\xsd\\\\maindoc\\\\UBL-Invoice-2.1.xsd",  		"enSchematron":"C:\\\\Office\\\\zatca-api\\\\public\\\\zatca-einvoicing-sdk-238-R3.3.3\\\\Data\\\\Rules\\\\schematrons\\\\CEN-EN16931-UBL.xsl", 		"zatcaSchematron":"C:\\\\Office\\\\zatca-api\\\\public\\\\zatca-einvoicing-sdk-238-R3.3.3\\\\Data\\\\Rules\\\\schematrons\\\\20210819_ZATCA_E-invoice_Validation_Rules.xsl", 		"certPath":"C:\\\\Office\\\\zatca-api\\\\public\\\\zatca-einvoicing-sdk-238-R3.3.3\\\\Data\\\\Certificates\\\\${organization.organizationIdentifier}\\\\cert.pem",		"privateKeyPath":"C:\\\\Office\\\\zatca-api\\\\public\\\\zatca-einvoicing-sdk-238-R3.3.3\\\\Data\\\\Certificates\\\\ec-secp256k1-priv-key.pem",		"pihPath" : "C:\\\\Office\\\\zatca-api\\\\public\\\\cert\\\\${organization.organizationIdentifier}\\\\pih.txt",		"inputPath" : "C:\\\\Office\\\\zatca-api\\\\public\\\\zatca-einvoicing-sdk-238-R3.3.3\\\\Data\\\\Input",		"usagePathFile":"C:\\\\Office\\\\zatca-api\\\\public\\\\zatca-einvoicing-sdk-238-R3.3.3\\\\Configuration\\\\usage.txt"     }`
        
        fs.writeFile('public/zatca-einvoicing-sdk-238-R3.3.3/Configuration/config.json', content, (err) => {
            if (err) {
                throw new Error("Failed to create config file");
            }
        });
        
        return true
    } catch (error) {
        console.log(error)
        throw new Error("Faild to setup config of certificate", error?.message)
    }

}


const getCSR = async serialNumber => {
    try {
        const certificateSigningRequest = await CertificateSigningRequestModel.findOne({
            serialNumber: serialNumber,
        });

        if (certificateSigningRequest) {
            console.log('CSR Fetched against the organization');
            return certificateSigningRequest;
        } else {
            console.log('Failed to get CSR, Creating new one ');
            const response = await axios.post('http://localhost:3003/api/csr/generate', {
                'csr.common.name': 'OGN-326431145-3333333329900003',
                'csr.serial.number': '1-OGN|2-OGN|3-ed22f1d8-e6e4-1118-9b58-d9a8f11e487h',
                'csr.organization.identifier': '312345678900003',
                'csr.organization.unit.name': 'Nebras',
                'csr.organization.name': 'Nebras Enterprise Private Limited',
                'csr.country.name': 'PK',
                'csr.invoice.type': '1100',
                'csr.location.address': 'RRRD1929',
                'csr.industry.business.category': 'Tech',
            });

            console.log('New CSR Generated');
            if (response.data) {
                return response.data.data;
            }
        }
    } catch (error) {
        console.log('CSR Not Available & Failed To Generate New One, Error Message :', error.response);
    }
};
const complianceCSIDGenerate = async (csr, otp, acceptVersion) => {
    try {
        if ((!csr, !otp, !acceptVersion)) {
            return console.log('CSR (binaryToken) is missing, or maybe OTP , AcceptVersion missing');
        }
        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance',
            { csr: csr },
            {
                headers: {
                    OTP: otp,
                    'Accept-Version': acceptVersion,
                },
            },
        );

        // CSR binaryToken and secretKey fetched
        const CSIDComplianceToken = await response?.data?.binarySecurityToken;
        const CSIDComplianceSecretKey = await response?.data?.secret;
        const CSIDComplianceRequestId = await response?.data?.requestID;

        //Also  Saving the generated CSID on database
        const csidObject = new CSIDComplianceModel({
            certificateSigningRequest: csr, //it's CSR id
            requestId: await CSIDComplianceRequestId,
            binaryToken: await CSIDComplianceToken,
            secretKey: await CSIDComplianceSecretKey,
        });
        const csidObjectSave = await csidObject.save();
        const CSIDCompliance_id = csidObjectSave._id;
        if (csidObjectSave) {
            console.log('CSID Compliance Generated & Saved');
            return { CSIDComplianceToken, CSIDComplianceSecretKey, CSIDComplianceRequestId, CSIDCompliance_id };
        }
    } catch (error) {
        console.error('Failed to generate or save CSID Compliance:', error);
    }
};
const onboardingCSIDGenerate = async (
    CSIDComplianceToken,
    CSIDComplianceSecretKey,
    CSIDComplianceRequestId,
    CSIDCompliance_id,
    acceptVersion,
) => {
    try {
        const requestId = CSIDComplianceRequestId;
        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/production/csids',
            {
                compliance_request_id: requestId,
            },
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${CSIDComplianceToken}:${CSIDComplianceSecretKey}`).toString(
                        'base64',
                    )}`,
                    'Accept-Version': acceptVersion,
                },
            },
        );

        const data = new CSIDOnboardingModel({
            cryptographicStampIdentifier: CSIDCompliance_id,
            requestId: response.data.requestID,
            tokenType: response.data.tokenType,
            binaryToken: response.data.binarySecurityToken,
            secretKey: response.data.secret,
        });
        const saved = await data.save();
        if (saved) {
            console.log('CSID Onboarding Generated & Saved');
            return response.data;
        } else {
            console.log('CSID Onboarding Generated, faild to  Save');
        }
    } catch (error) {
        console.log('CSID Onboarding faild to Generate and Save, error :', error);
    }
};
const signXML = async (unsignedPath, signedPath) => {
    console.log('Signing Invoice');

    return new Promise((resolve, reject) => {
        try {
            console.log('unsignedPath', unsignedPath);
            // "xmls/simplified/unsigned/simplified_signed.xml"
            // Start the child process to sign the invoice
            const childProcess = spawn('fatoora', [`-sign -invoice ${unsignedPath} -signedInvoice ${signedPath}`], {
                shell: true,
            });

            const stdoutData = []; // Array to store stdout data

            // Listen for data on stdout
            childProcess.stdout.on('data', data => {
                const output = data?.toString()?.trim(); // Trim to remove leading/trailing whitespace
                stdoutData.push(output); // Store each piece of stdout data in the array
                console.log(`stdout: ${output}`);
            });

            // Listen for data on stderr
            childProcess.stderr.on('data', data => {
                console.error(`stderr: ${data}`);
            });

            // Listen for the child process to exit
            childProcess.on('close', code => {
                if (code === 0) {
                    resolve(signedPath);
                    // Resolve the Promise with the collected stdout data
                } else {
                    reject(new Error(`Child process exited with code ${code}`));
                    return false;
                }
            });
        } catch (error) {
            reject(`Failed to sign invoice, error: ${error}`);
            return false;
        }
    });
};
async function generatePhaseTwoQr(xmlPath) {
    console.log('QR FUNC Start');
    console.log('QR FUNC RUNNING ON THIS XML', xmlPath);

    return new Promise((resolve, reject) => {
        const childProcessQr = spawn('fatoora', ['-qr', '-invoice', xmlPath], {
            shell: true,
        });

        let qrData = '';

        childProcessQr.stdout.on('data', data => {
            const dataStr = data.toString('utf8').trim();
            console.log('QR process data:', dataStr);
            qrData += dataStr;
        });

        childProcessQr.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });

        childProcessQr.on('close', code => {
            if (code !== 0) {
                return reject(new Error(`Child process exited with code ${code}`));
            }

            try {
                console.log('qrData before slice', qrData);
                const qrMatches = qrData?.match(/QR code =\s*(\S+)/);
                if (!qrMatches || qrMatches?.length < 2) {
                    return reject(new Error('QR code not found in the output.'));
                }

                const base64QR = qrMatches[1];
                console.log('Extracted QR code:', base64QR);

                resolve(base64QR);
            } catch (err) {
                reject('Failed to extract QR code: ' + err);
            }
        });
    });
}
async function generateInvoiceHash(xmlPath,organization) {
    return new Promise((resolve, reject) => {
        console.log('xmlPath TO JSON', xmlPath);
        const childProcessHash = spawn('fatoora', ['-generateHash', '-invoice', xmlPath], { shell: true });
        console.log('han comin ', xmlPath);

        let hashData = '';

        childProcessHash.stdout.on('data', data => {
            const dataStr = data?.toString('utf8')?.trim();
            console.log('hash process data:', dataStr);
            hashData += dataStr;
        });

        childProcessHash.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });
        // testing push for check
        childProcessHash.on('close', async code => {
            if (code !== 0) {
                return reject(new Error(`Child process exited with code ${code}`));
            }

            try {
                const hashMatches = hashData?.match(/INVOICE HASH =\s*(\S+)/);
                if (!hashMatches || hashMatches.length < 2) {
                    return reject(new Error('Invoice hash not found in the output.'));
                }

                const hash = hashMatches[1];
                console.log('Extracted Hash:', hash);
                try {
                    // public/zatca-einvoicing-sdk-238-R3.3.3/Data/PIH/pih.txt
                     fs.writeFile(`public/cert/${organization.organizationIdentifier}/pih.txt`, hash, err => {
                        if (err) {
                            reject(new Error('Error writing the file: ' + err));
                            return;
                        }
                        // console.log(hash)
                        console.log(hash);
                        resolve(hash);
                    });
                } catch (err) {
                 throw new Error("Issue in updating PIH")
                    reject('Failed to update PIH: ' + err);
                }
            } catch (err) {
                throw new Error('Failed to extract hash: ' + err);
                reject('Failed to extract hash: ' + err);
            }
        });
    });
}
async function generateInvoiceJSON(xmlPath, fileId, Standard) {
    let generatedJSON;
    (await Standard)
        ? (generatedJSON = `public/files/xmls/standard/generatedJSON/JSON_${fileId}.json`)
        : (generatedJSON = `public/files/xmls/simplified/generatedJSON/JSON_${fileId}.json`);

    return new Promise((resolve, reject) => {
        const childProcessHash = spawn(
            'fatoora',
            ['-invoiceRequest', '-invoice', xmlPath, `-apiRequest ${generatedJSON}`],
            {
                shell: true,
            },
        );
        const JSONVObj = []; // Array to store QR code data

        childProcessHash.stdout.on('data', async data => {
            const hashVal = await data?.toString('utf8')?.trim();

            JSONVObj.push(hashVal); // Store each QR value in the array
            console.log('json loop log', hashVal);
        });

        childProcessHash.on('close', async code => {
            console.log('JSON generated', code);
            if (code === 0) {
                try {
                    // const jsonData = fs.readFileSync(generatedJSON, 'utf8');
                    // const parsedData = JSON.parse(jsonData);
                    // console.log("Invoice JSON is generated & parsed");
                    // resolve(parsedData);

                    fs.readFile(generatedJSON, 'utf8', async function (err, data) {
                        try {
                            console.log('generatedJSON', data);
                            const parsedData = await JSON.parse(data);
                            resolve(parsedData);
                        } catch (error) {
                            console.log(error);
                        }
                    });
                } catch (err) {
                    console.error('Error reading or parsing JSON file:', err);
                    reject(err);
                }
            } else {
                reject(new Error(`Child process exited with code ${code}`));
            }
        });
    });
}
async function ReportInvoice(InvoiceJson, authorization) {
    {
        InvoiceJson && console.log('InvoiceJson is going to report');
    }
    console.log('InvoiceJson is here', InvoiceJson);

    const url = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/invoices/reporting/single';
    // const username =
    //     'TUlJRkJUQ0NCS3VnQXdJQkFnSVRFd0FBUk5rWVFJOGg3NkZ0WlFBQkFBQkUyVEFLQmdncWhrak9QUVFEQWpCaU1SVXdFd1lLQ1pJbWlaUHlMR1FCR1JZRmJHOWpZV3d4RXpBUkJnb0praWFKay9Jc1pBRVpGZ05uYjNZeEZ6QVZCZ29Ka2lhSmsvSXNaQUVaRmdkbGVIUm5ZWHAwTVJzd0dRWURWUVFERXhKUVJWcEZTVTVXVDBsRFJWTkRRVEl0UTBFd0hoY05NalF3TlRNd01EVTFOelUyV2hjTk1qWXdOVE13TURZd056VTJXakJzTVFzd0NRWURWUVFHRXdKVFFURWpNQ0VHQTFVRUNoTWFSbWxzZEdWeWN5QkZlSEJsY25SeklGUnlZV1JwYm1jZ1EyOHhEekFOQmdOVkJBc1RCa3BsWkdSaGFERW5NQ1VHQTFVRUF4TWVSa1ZVTFRRd016QXlNamd4TkRrdE16RXhNREEzTVRReE5qQXdNREF6TUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVRWGtEZTgrWUZLbk5zdWpaQXR0dU1IbG9oQjFUbWdrQTVIaWZuWVdHZHdOK0JXNEk2eGM1SzA3anFhcWdJdmcvd1NqaXAwS2lLM3R1VG9ZVFFmOHpBS09DQXpjd2dnTXpNSUdoQmdOVkhSRUVnWmt3Z1pha2daTXdnWkF4T3pBNUJnTlZCQVFNTWpFdFJrVlVmREl0UmtWVWZETXRaV1UxT0dVNFkyTXRaVEJsWmkwMFlUZzJMVGcwTWprdFlqZGtObU15WldJNE4yVmpNUjh3SFFZS0NaSW1pWlB5TEdRQkFRd1BNekV4TURBM01UUXhOakF3TURBek1RMHdDd1lEVlFRTURBUXhNVEF3TVE4d0RRWURWUVFhREFaS1pXUmtZV2d4RURBT0JnTlZCQThNQjFSeVlXUnBibWN3SFFZRFZSME9CQllFRkoyV25oVVlpbkdWSUdKUi9la3dKT3RiMUJNV01COEdBMVVkSXdRWU1CYUFGSUh5bzN0eWU3MVFvMnFmOGVqVGpkWjduSEMxTUlIbEJnTlZIUjhFZ2Qwd2dkb3dnZGVnZ2RTZ2dkR0dnYzVzWkdGd09pOHZMME5PUFZCRldrVkpUbFpQU1VORlUwTkJNaTFEUVNneEtTeERUajFRVWxwRlNVNVdUMGxEUlZCTFNUSXNRMDQ5UTBSUUxFTk9QVkIxWW14cFl5VXlNRXRsZVNVeU1GTmxjblpwWTJWekxFTk9QVk5sY25acFkyVnpMRU5PUFVOdmJtWnBaM1Z5WVhScGIyNHNSRU05WlhoMGVtRjBZMkVzUkVNOVoyOTJMRVJEUFd4dlkyRnNQMk5sY25ScFptbGpZWFJsVW1WMmIyTmhkR2x2Ymt4cGMzUS9ZbUZ6WlQ5dlltcGxZM1JEYkdGemN6MWpVa3hFYVhOMGNtbGlkWFJwYjI1UWIybHVkRENCemdZSUt3WUJCUVVIQVFFRWdjRXdnYjR3Z2JzR0NDc0dBUVVGQnpBQ2hvR3ViR1JoY0Rvdkx5OURUajFRUlZwRlNVNVdUMGxEUlZORFFUSXRRMEVzUTA0OVFVbEJMRU5PUFZCMVlteHBZeVV5TUV0bGVTVXlNRk5sY25acFkyVnpMRU5PUFZObGNuWnBZMlZ6TEVOT1BVTnZibVpwWjNWeVlYUnBiMjRzUkVNOVpYaDBlbUYwWTJFc1JFTTlaMjkyTEVSRFBXeHZZMkZzUDJOQlEyVnlkR2xtYVdOaGRHVS9ZbUZ6WlQ5dlltcGxZM1JEYkdGemN6MWpaWEowYVdacFkyRjBhVzl1UVhWMGFHOXlhWFI1TUE0R0ExVWREd0VCL3dRRUF3SUhnREE4QmdrckJnRUVBWUkzRlFjRUx6QXRCaVVyQmdFRUFZSTNGUWlCaHFnZGhORDdFb2J0blNTSHp2c1owOEJWWm9HYzJDMkQ1Y1ZkQWdGa0FnRVFNQjBHQTFVZEpRUVdNQlFHQ0NzR0FRVUZCd01DQmdnckJnRUZCUWNEQXpBbkJna3JCZ0VFQVlJM0ZRb0VHakFZTUFvR0NDc0dBUVVGQndNQ01Bb0dDQ3NHQVFVRkJ3TURNQW9HQ0NxR1NNNDlCQU1DQTBnQU1FVUNJREhmc21rdzJPMW1WdHcxRldmbTIxTEZVQXNEMUtRb2dRc2dFdldKT3A2aEFpRUFxeGRuRTVpclBXYkU0SWNFVjlpOU0wTlNCcHFVb3V6VmxvK0dzVXpoWndzPQ==';
    // const password = 'bTdRfHQkUWJyVgwNKGrOVlCD6zUSHd+W2X0fktfw7IQ=';
    const config = {
        headers: {
            // Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            Authorization: authorization,
            'Accept-Version': 'V2',
            'Accept-Language': 'en',
            'Content-Type': 'application/json',
        },
    };
    try {
        console.log('API Start');
        const response = await axios.post(url, InvoiceJson, config);
        console.log('API Status:', response.status);
        console.log('API Response:', response.data);

        console.log('our reporting data', response?.data);

        if (response?.status == 200 || response?.status == 202) {
            const actualResponse = { data: response?.data, status: response?.status };
            return actualResponse;
        }
    } catch (error) {
        console.error('Error making API request:', error?.response ? error?.response?.data : error?.message);

        throw new Error('Failed to post fatoora api (reporting api)' + ', ' + error);
    }
}
async function ClearInvoice(data, authorization) {
    if (!data || !authorization) {
        throw new Error('body data or authorization is not recieving in clearance function');
    }
    // Authorization: `Basic ${Buffer.from(
    //     `TUlJRkJUQ0NCS3VnQXdJQkFnSVRFd0FBUk5rWVFJOGg3NkZ0WlFBQkFBQkUyVEFLQmdncWhrak9QUVFEQWpCaU1SVXdFd1lLQ1pJbWlaUHlMR1FCR1JZRmJHOWpZV3d4RXpBUkJnb0praWFKay9Jc1pBRVpGZ05uYjNZeEZ6QVZCZ29Ka2lhSmsvSXNaQUVaRmdkbGVIUm5ZWHAwTVJzd0dRWURWUVFERXhKUVJWcEZTVTVXVDBsRFJWTkRRVEl0UTBFd0hoY05NalF3TlRNd01EVTFOelUyV2hjTk1qWXdOVE13TURZd056VTJXakJzTVFzd0NRWURWUVFHRXdKVFFURWpNQ0VHQTFVRUNoTWFSbWxzZEdWeWN5QkZlSEJsY25SeklGUnlZV1JwYm1jZ1EyOHhEekFOQmdOVkJBc1RCa3BsWkdSaGFERW5NQ1VHQTFVRUF4TWVSa1ZVTFRRd016QXlNamd4TkRrdE16RXhNREEzTVRReE5qQXdNREF6TUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVRWGtEZTgrWUZLbk5zdWpaQXR0dU1IbG9oQjFUbWdrQTVIaWZuWVdHZHdOK0JXNEk2eGM1SzA3anFhcWdJdmcvd1NqaXAwS2lLM3R1VG9ZVFFmOHpBS09DQXpjd2dnTXpNSUdoQmdOVkhSRUVnWmt3Z1pha2daTXdnWkF4T3pBNUJnTlZCQVFNTWpFdFJrVlVmREl0UmtWVWZETXRaV1UxT0dVNFkyTXRaVEJsWmkwMFlUZzJMVGcwTWprdFlqZGtObU15WldJNE4yVmpNUjh3SFFZS0NaSW1pWlB5TEdRQkFRd1BNekV4TURBM01UUXhOakF3TURBek1RMHdDd1lEVlFRTURBUXhNVEF3TVE4d0RRWURWUVFhREFaS1pXUmtZV2d4RURBT0JnTlZCQThNQjFSeVlXUnBibWN3SFFZRFZSME9CQllFRkoyV25oVVlpbkdWSUdKUi9la3dKT3RiMUJNV01COEdBMVVkSXdRWU1CYUFGSUh5bzN0eWU3MVFvMnFmOGVqVGpkWjduSEMxTUlIbEJnTlZIUjhFZ2Qwd2dkb3dnZGVnZ2RTZ2dkR0dnYzVzWkdGd09pOHZMME5PUFZCRldrVkpUbFpQU1VORlUwTkJNaTFEUVNneEtTeERUajFRVWxwRlNVNVdUMGxEUlZCTFNUSXNRMDQ5UTBSUUxFTk9QVkIxWW14cFl5VXlNRXRsZVNVeU1GTmxjblpwWTJWekxFTk9QVk5sY25acFkyVnpMRU5PUFVOdmJtWnBaM1Z5WVhScGIyNHNSRU05WlhoMGVtRjBZMkVzUkVNOVoyOTJMRVJEUFd4dlkyRnNQMk5sY25ScFptbGpZWFJsVW1WMmIyTmhkR2x2Ymt4cGMzUS9ZbUZ6WlQ5dlltcGxZM1JEYkdGemN6MWpVa3hFYVhOMGNtbGlkWFJwYjI1UWIybHVkRENCemdZSUt3WUJCUVVIQVFFRWdjRXdnYjR3Z2JzR0NDc0dBUVVGQnpBQ2hvR3ViR1JoY0Rvdkx5OURUajFRUlZwRlNVNVdUMGxEUlZORFFUSXRRMEVzUTA0OVFVbEJMRU5PUFZCMVlteHBZeVV5TUV0bGVTVXlNRk5sY25acFkyVnpMRU5PUFZObGNuWnBZMlZ6TEVOT1BVTnZibVpwWjNWeVlYUnBiMjRzUkVNOVpYaDBlbUYwWTJFc1JFTTlaMjkyTEVSRFBXeHZZMkZzUDJOQlEyVnlkR2xtYVdOaGRHVS9ZbUZ6WlQ5dlltcGxZM1JEYkdGemN6MWpaWEowYVdacFkyRjBhVzl1UVhWMGFHOXlhWFI1TUE0R0ExVWREd0VCL3dRRUF3SUhnREE4QmdrckJnRUVBWUkzRlFjRUx6QXRCaVVyQmdFRUFZSTNGUWlCaHFnZGhORDdFb2J0blNTSHp2c1owOEJWWm9HYzJDMkQ1Y1ZkQWdGa0FnRVFNQjBHQTFVZEpRUVdNQlFHQ0NzR0FRVUZCd01DQmdnckJnRUZCUWNEQXpBbkJna3JCZ0VFQVlJM0ZRb0VHakFZTUFvR0NDc0dBUVVGQndNQ01Bb0dDQ3NHQVFVRkJ3TURNQW9HQ0NxR1NNNDlCQU1DQTBnQU1FVUNJREhmc21rdzJPMW1WdHcxRldmbTIxTEZVQXNEMUtRb2dRc2dFdldKT3A2aEFpRUFxeGRuRTVpclBXYkU0SWNFVjlpOU0wTlNCcHFVb3V6VmxvK0dzVXpoWndzPQ==:bTdRfHQkUWJyVgwNKGrOVlCD6zUSHd+W2X0fktfw7IQ=`,
    // )?.toString('base64')}`,
    try {
        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/invoices/clearance/single',
            data,
            {
                headers: {
                    Authorization: authorization,
                    'Accept-Version': 'V2',
                    'Accept-Language': 'en',
                    'Content-Type': 'application/json',
                },
            },
        );

        console.log('our clearance data', response?.data);

        if (response?.status == 200 || response?.status == 202) {
            const actualResponse = { data: response?.data, status: response?.status };
            return actualResponse;
        }
    } catch (error) {
        // if (error?.response?.status == 401) {
        //     throw new Error('Authorization error in clearnace', error.message);
        // }
        console.log('api error', error);
        throw new Error('Failed to post fatoora api' + ', ' + error);
    }
}
async function UpdateDocumentNo(body) {
    try {
        const prefixnumber = await body?.ardocumentno.slice(0, -6);
        // console.log('prefixnumber', prefixnumber);

        const numberRangeConfig = await numberRangeConfigModel.findOne({});

        const counterInc = numberRangeConfig?.counter + 1;
        const suffixInc = (parseInt(numberRangeConfig.suffix) + 1).toString().padStart(6, '0');
        // console.log('counterInc', counterInc);
        console.log('suffixInc', suffixInc);
        console.log('suffixInc type', typeof suffixInc);

        return { counterInc, prefixnumber, suffixInc };
    } catch (error) {
        throw new Error(error.message);
    }
}
async function getCounterNumber(req, res) {
    try {
        const response = await numberRangeConfigModel.find();

        console.log('Document count', response[0].counter);
        res.status(200).json({ message: 'Invoice Counter Value Fetched', data: response[0]?.counter });
    } catch (error) {
        console.log('error in getting invoice counter number ', error);
        throw new Error(error);
    }
}
async function DummyApi() {
    try {
        const response = await axios.post('https://dummyjson.com/posts/add', {
            title: 'testing',
            userId: 1,
        });
        console.log('Dummy api response', response.data);

        return 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPEludm9pY2UgeG1sbnM9InVybjpvYXNpczpuYW1lczpzcGVjaWZpY2F0aW9uOnVibDpzY2hlbWE6eHNkOkludm9pY2UtMiIgeG1sbnM6Y2FjPSJ1cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2NoZW1hOnhzZDpDb21tb25BZ2dyZWdhdGVDb21wb25lbnRzLTIiIHhtbG5zOmNiYz0idXJuOm9hc2lzOm5hbWVzOnNwZWNpZmljYXRpb246dWJsOnNjaGVtYTp4c2Q6Q29tbW9uQmFzaWNDb21wb25lbnRzLTIiIHhtbG5zOmV4dD0idXJuOm9hc2lzOm5hbWVzOnNwZWNpZmljYXRpb246dWJsOnNjaGVtYTp4c2Q6Q29tbW9uRXh0ZW5zaW9uQ29tcG9uZW50cy0yIj48ZXh0OlVCTEV4dGVuc2lvbnM+CiAgICA8ZXh0OlVCTEV4dGVuc2lvbj4KICAgICAgICA8ZXh0OkV4dGVuc2lvblVSST51cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6ZHNpZzplbnZlbG9wZWQ6eGFkZXM8L2V4dDpFeHRlbnNpb25VUkk+CiAgICAgICAgPGV4dDpFeHRlbnNpb25Db250ZW50PgogICAgICAgICAgICA8c2lnOlVCTERvY3VtZW50U2lnbmF0dXJlcyB4bWxuczpzaWc9InVybjpvYXNpczpuYW1lczpzcGVjaWZpY2F0aW9uOnVibDpzY2hlbWE6eHNkOkNvbW1vblNpZ25hdHVyZUNvbXBvbmVudHMtMiIgeG1sbnM6c2FjPSJ1cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2NoZW1hOnhzZDpTaWduYXR1cmVBZ2dyZWdhdGVDb21wb25lbnRzLTIiIHhtbG5zOnNiYz0idXJuOm9hc2lzOm5hbWVzOnNwZWNpZmljYXRpb246dWJsOnNjaGVtYTp4c2Q6U2lnbmF0dXJlQmFzaWNDb21wb25lbnRzLTIiPgogICAgICAgICAgICAgICAgPHNhYzpTaWduYXR1cmVJbmZvcm1hdGlvbj4gCiAgICAgICAgICAgICAgICAgICAgPGNiYzpJRD51cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2lnbmF0dXJlOjE8L2NiYzpJRD4KICAgICAgICAgICAgICAgICAgICA8c2JjOlJlZmVyZW5jZWRTaWduYXR1cmVJRD51cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2lnbmF0dXJlOkludm9pY2U8L3NiYzpSZWZlcmVuY2VkU2lnbmF0dXJlSUQ+CiAgICAgICAgICAgICAgICAgICAgPGRzOlNpZ25hdHVyZSB4bWxuczpkcz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnIyIgSWQ9InNpZ25hdHVyZSI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkczpTaWduZWRJbmZvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOkNhbm9uaWNhbGl6YXRpb25NZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDA2LzEyL3htbC1jMTRuMTEiLz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpTaWduYXR1cmVNZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNlY2RzYS1zaGEyNTYiLz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpSZWZlcmVuY2UgSWQ9Imludm9pY2VTaWduZWREYXRhIiBVUkk9IiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlRyYW5zZm9ybXM+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpUcmFuc2Zvcm0gQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy9UUi8xOTk5L1JFQy14cGF0aC0xOTk5MTExNiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6WFBhdGg+bm90KC8vYW5jZXN0b3Itb3Itc2VsZjo6ZXh0OlVCTEV4dGVuc2lvbnMpPC9kczpYUGF0aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kczpUcmFuc2Zvcm0+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpUcmFuc2Zvcm0gQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy9UUi8xOTk5L1JFQy14cGF0aC0xOTk5MTExNiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6WFBhdGg+bm90KC8vYW5jZXN0b3Itb3Itc2VsZjo6Y2FjOlNpZ25hdHVyZSk8L2RzOlhQYXRoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2RzOlRyYW5zZm9ybT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlRyYW5zZm9ybSBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnL1RSLzE5OTkvUkVDLXhwYXRoLTE5OTkxMTE2Ij4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpYUGF0aD5ub3QoLy9hbmNlc3Rvci1vci1zZWxmOjpjYWM6QWRkaXRpb25hbERvY3VtZW50UmVmZXJlbmNlW2NiYzpJRD0nUVInXSk8L2RzOlhQYXRoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2RzOlRyYW5zZm9ybT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlRyYW5zZm9ybSBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDYvMTIveG1sLWMxNG4xMSIvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6VHJhbnNmb3Jtcz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6RGlnZXN0TWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8wNC94bWxlbmMjc2hhMjU2Ii8+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOkRpZ2VzdFZhbHVlPmZTeHoyOWNjNWQ1R2dyOEszRmFXZm9sQ3EvaFA4YVpFb3lFZFNtcEZNRGs9PC9kczpEaWdlc3RWYWx1ZT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6UmVmZXJlbmNlPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlJlZmVyZW5jZSBUeXBlPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwLzA5L3htbGRzaWcjU2lnbmF0dXJlUHJvcGVydGllcyIgVVJJPSIjeGFkZXNTaWduZWRQcm9wZXJ0aWVzIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6RGlnZXN0TWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8wNC94bWxlbmMjc2hhMjU2Ii8+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOkRpZ2VzdFZhbHVlPk16TTFZakEzTm1WbVlqRXdaVGxpWVdFNU1EUmlORE01T1dFNU5UbGxZVGsxWmpJNE4yUXlZV1ZoT1dJeE1UbGxaREZpTVRNMllqYzBNalJrTWpVek53PT08L2RzOkRpZ2VzdFZhbHVlPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kczpSZWZlcmVuY2U+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6U2lnbmVkSW5mbz4KICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlNpZ25hdHVyZVZhbHVlPk1FUUNJRXlqVnRyTVVmbGRWRmRQNkR3d3VsVFBsVnRlNVB3bGY3cHIrQXZuLytYMUFpQXRXZTBIQkFOTTNFaHQ0ZS9UMTI5Vk0rWXFVK2U3U2EyZmVmZDF1V0hDQ0E9PTwvZHM6U2lnbmF0dXJlVmFsdWU+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkczpLZXlJbmZvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlg1MDlEYXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpYNTA5Q2VydGlmaWNhdGU+TUlJRkJUQ0NCS3VnQXdJQkFnSVRFd0FBUk5rWVFJOGg3NkZ0WlFBQkFBQkUyVEFLQmdncWhrak9QUVFEQWpCaU1SVXdFd1lLQ1pJbWlaUHlMR1FCR1JZRmJHOWpZV3d4RXpBUkJnb0praWFKay9Jc1pBRVpGZ05uYjNZeEZ6QVZCZ29Ka2lhSmsvSXNaQUVaRmdkbGVIUm5ZWHAwTVJzd0dRWURWUVFERXhKUVJWcEZTVTVXVDBsRFJWTkRRVEl0UTBFd0hoY05NalF3TlRNd01EVTFOelUyV2hjTk1qWXdOVE13TURZd056VTJXakJzTVFzd0NRWURWUVFHRXdKVFFURWpNQ0VHQTFVRUNoTWFSbWxzZEdWeWN5QkZlSEJsY25SeklGUnlZV1JwYm1jZ1EyOHhEekFOQmdOVkJBc1RCa3BsWkdSaGFERW5NQ1VHQTFVRUF4TWVSa1ZVTFRRd016QXlNamd4TkRrdE16RXhNREEzTVRReE5qQXdNREF6TUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVRWGtEZTgrWUZLbk5zdWpaQXR0dU1IbG9oQjFUbWdrQTVIaWZuWVdHZHdOK0JXNEk2eGM1SzA3anFhcWdJdmcvd1NqaXAwS2lLM3R1VG9ZVFFmOHpBS09DQXpjd2dnTXpNSUdoQmdOVkhSRUVnWmt3Z1pha2daTXdnWkF4T3pBNUJnTlZCQVFNTWpFdFJrVlVmREl0UmtWVWZETXRaV1UxT0dVNFkyTXRaVEJsWmkwMFlUZzJMVGcwTWprdFlqZGtObU15WldJNE4yVmpNUjh3SFFZS0NaSW1pWlB5TEdRQkFRd1BNekV4TURBM01UUXhOakF3TURBek1RMHdDd1lEVlFRTURBUXhNVEF3TVE4d0RRWURWUVFhREFaS1pXUmtZV2d4RURBT0JnTlZCQThNQjFSeVlXUnBibWN3SFFZRFZSME9CQllFRkoyV25oVVlpbkdWSUdKUi9la3dKT3RiMUJNV01COEdBMVVkSXdRWU1CYUFGSUh5bzN0eWU3MVFvMnFmOGVqVGpkWjduSEMxTUlIbEJnTlZIUjhFZ2Qwd2dkb3dnZGVnZ2RTZ2dkR0dnYzVzWkdGd09pOHZMME5PUFZCRldrVkpUbFpQU1VORlUwTkJNaTFEUVNneEtTeERUajFRVWxwRlNVNVdUMGxEUlZCTFNUSXNRMDQ5UTBSUUxFTk9QVkIxWW14cFl5VXlNRXRsZVNVeU1GTmxjblpwWTJWekxFTk9QVk5sY25acFkyVnpMRU5PUFVOdmJtWnBaM1Z5WVhScGIyNHNSRU05WlhoMGVtRjBZMkVzUkVNOVoyOTJMRVJEUFd4dlkyRnNQMk5sY25ScFptbGpZWFJsVW1WMmIyTmhkR2x2Ymt4cGMzUS9ZbUZ6WlQ5dlltcGxZM1JEYkdGemN6MWpVa3hFYVhOMGNtbGlkWFJwYjI1UWIybHVkRENCemdZSUt3WUJCUVVIQVFFRWdjRXdnYjR3Z2JzR0NDc0dBUVVGQnpBQ2hvR3ViR1JoY0Rvdkx5OURUajFRUlZwRlNVNVdUMGxEUlZORFFUSXRRMEVzUTA0OVFVbEJMRU5PUFZCMVlteHBZeVV5TUV0bGVTVXlNRk5sY25acFkyVnpMRU5PUFZObGNuWnBZMlZ6TEVOT1BVTnZibVpwWjNWeVlYUnBiMjRzUkVNOVpYaDBlbUYwWTJFc1JFTTlaMjkyTEVSRFBXeHZZMkZzUDJOQlEyVnlkR2xtYVdOaGRHVS9ZbUZ6WlQ5dlltcGxZM1JEYkdGemN6MWpaWEowYVdacFkyRjBhVzl1UVhWMGFHOXlhWFI1TUE0R0ExVWREd0VCL3dRRUF3SUhnREE4QmdrckJnRUVBWUkzRlFjRUx6QXRCaVVyQmdFRUFZSTNGUWlCaHFnZGhORDdFb2J0blNTSHp2c1owOEJWWm9HYzJDMkQ1Y1ZkQWdGa0FnRVFNQjBHQTFVZEpRUVdNQlFHQ0NzR0FRVUZCd01DQmdnckJnRUZCUWNEQXpBbkJna3JCZ0VFQVlJM0ZRb0VHakFZTUFvR0NDc0dBUVVGQndNQ01Bb0dDQ3NHQVFVRkJ3TURNQW9HQ0NxR1NNNDlCQU1DQTBnQU1FVUNJREhmc21rdzJPMW1WdHcxRldmbTIxTEZVQXNEMUtRb2dRc2dFdldKT3A2aEFpRUFxeGRuRTVpclBXYkU0SWNFVjlpOU0wTlNCcHFVb3V6VmxvK0dzVXpoWndzPTwvZHM6WDUwOUNlcnRpZmljYXRlPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kczpYNTA5RGF0YT4KICAgICAgICAgICAgICAgICAgICAgICAgPC9kczpLZXlJbmZvPgogICAgICAgICAgICAgICAgICAgICAgICA8ZHM6T2JqZWN0PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHhhZGVzOlF1YWxpZnlpbmdQcm9wZXJ0aWVzIHhtbG5zOnhhZGVzPSJodHRwOi8vdXJpLmV0c2kub3JnLzAxOTAzL3YxLjMuMiMiIFRhcmdldD0ic2lnbmF0dXJlIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8eGFkZXM6U2lnbmVkUHJvcGVydGllcyBJZD0ieGFkZXNTaWduZWRQcm9wZXJ0aWVzIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHhhZGVzOlNpZ25lZFNpZ25hdHVyZVByb3BlcnRpZXM+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8eGFkZXM6U2lnbmluZ1RpbWU+MjAyNC0wNi0wM1QwOToyMTozMDwveGFkZXM6U2lnbmluZ1RpbWU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8eGFkZXM6U2lnbmluZ0NlcnRpZmljYXRlPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx4YWRlczpDZXJ0PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8eGFkZXM6Q2VydERpZ2VzdD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpEaWdlc3RNZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGVuYyNzaGEyNTYiLz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpEaWdlc3RWYWx1ZT5NMlV6T0dJd01ESTJOemt6TkdRM1l6YzROVEkwT1RobVlUQXdNemhtTVdObE9UUTJNak16WmpGbFpEVTFObUV3TTJKalpUQTBNV05oWW1Rd09HSmpaQT09PC9kczpEaWdlc3RWYWx1ZT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC94YWRlczpDZXJ0RGlnZXN0PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8eGFkZXM6SXNzdWVyU2VyaWFsPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlg1MDlJc3N1ZXJOYW1lPkNOPVBFWkVJTlZPSUNFU0NBMi1DQSwgREM9ZXh0Z2F6dCwgREM9Z292LCBEQz1sb2NhbDwvZHM6WDUwOUlzc3Vlck5hbWU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6WDUwOVNlcmlhbE51bWJlcj40MjM3MTQyNTAyODY4MDU4NjQwOTU3ODY3MzI5MzU2MzM0MjE4OTEyOTAzMjk8L2RzOlg1MDlTZXJpYWxOdW1iZXI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwveGFkZXM6SXNzdWVyU2VyaWFsPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwveGFkZXM6Q2VydD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwveGFkZXM6U2lnbmluZ0NlcnRpZmljYXRlPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3hhZGVzOlNpZ25lZFNpZ25hdHVyZVByb3BlcnRpZXM+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC94YWRlczpTaWduZWRQcm9wZXJ0aWVzPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC94YWRlczpRdWFsaWZ5aW5nUHJvcGVydGllcz4KICAgICAgICAgICAgICAgICAgICAgICAgPC9kczpPYmplY3Q+CiAgICAgICAgICAgICAgICAgICAgPC9kczpTaWduYXR1cmU+CiAgICAgICAgICAgICAgICA8L3NhYzpTaWduYXR1cmVJbmZvcm1hdGlvbj4KICAgICAgICAgICAgPC9zaWc6VUJMRG9jdW1lbnRTaWduYXR1cmVzPgogICAgICAgIDwvZXh0OkV4dGVuc2lvbkNvbnRlbnQ+CiAgICA8L2V4dDpVQkxFeHRlbnNpb24+CjwvZXh0OlVCTEV4dGVuc2lvbnM+CiAgICAKICAgIDxjYmM6UHJvZmlsZUlEPnJlcG9ydGluZzoxLjA8L2NiYzpQcm9maWxlSUQ+CiAgICA8Y2JjOklEPjAxMDItMDFSU1IyNDA2MDAwMDA5PC9jYmM6SUQ+CiAgICA8Y2JjOlVVSUQ+NWI2NzZiNWUtODk3MC00MTRlLWE2ZGItYjI3ZWFkNDRkN2M0PC9jYmM6VVVJRD4KICAgIDxjYmM6SXNzdWVEYXRlPjIwMjQtMDYtMDI8L2NiYzpJc3N1ZURhdGU+CiAgICA8Y2JjOklzc3VlVGltZT4yMzoxNzoyNDwvY2JjOklzc3VlVGltZT4KICAgIDxjYmM6SW52b2ljZVR5cGVDb2RlIG5hbWU9IjAxMDAwMDAiPjM4ODwvY2JjOkludm9pY2VUeXBlQ29kZT4KICAgIDxjYmM6RG9jdW1lbnRDdXJyZW5jeUNvZGU+U0FSPC9jYmM6RG9jdW1lbnRDdXJyZW5jeUNvZGU+CiAgICA8Y2JjOlRheEN1cnJlbmN5Q29kZT5TQVI8L2NiYzpUYXhDdXJyZW5jeUNvZGU+CiAgICA8Y2FjOkFkZGl0aW9uYWxEb2N1bWVudFJlZmVyZW5jZT4KICAgICAgICA8Y2JjOklEPklDVjwvY2JjOklEPgogICAgICAgIDxjYmM6VVVJRD40MzQ8L2NiYzpVVUlEPgogICAgPC9jYWM6QWRkaXRpb25hbERvY3VtZW50UmVmZXJlbmNlPgogICAgPGNhYzpBZGRpdGlvbmFsRG9jdW1lbnRSZWZlcmVuY2U+CiAgICAgICAgPGNiYzpJRD5QSUg8L2NiYzpJRD4KICAgICAgICA8Y2FjOkF0dGFjaG1lbnQ+CiAgICAgICAgICAgIDxjYmM6RW1iZWRkZWREb2N1bWVudEJpbmFyeU9iamVjdCBtaW1lQ29kZT0idGV4dC9wbGFpbiI+WGh1aURKOHpEaUVGU2hrdmxqTjl1S252aHBpUkt2WGFOVnBza0NSUjI2Zz08L2NiYzpFbWJlZGRlZERvY3VtZW50QmluYXJ5T2JqZWN0PgogICAgICAgIDwvY2FjOkF0dGFjaG1lbnQ+CiAgICA8L2NhYzpBZGRpdGlvbmFsRG9jdW1lbnRSZWZlcmVuY2U+CgogICAgPGNhYzpBZGRpdGlvbmFsRG9jdW1lbnRSZWZlcmVuY2U+CiAgICAgICAgPGNiYzpJRD5RUjwvY2JjOklEPgogICAgICAgIDxjYWM6QXR0YWNobWVudD4KICAgICAgICAgICAgPGNiYzpFbWJlZGRlZERvY3VtZW50QmluYXJ5T2JqZWN0IG1pbWVDb2RlPSJ0ZXh0L3BsYWluIj5BU05GY1hWcGNHMWxiblFnVUdGeWRITWdSWGh3WlhKMGN5QlVjbUZrYVc1bklFTnZMZ0lQTXpFeE1EQTNNVFF4TmpBd01EQXpBeE15TURJMExUQTJMVEF5VkRJek9qRTNPakkwQkFZek16TXVNRE1GQlRRekxqUTBCaXhtVTNoNk1qbGpZelZrTlVkbmNqaExNMFpoVjJadmJFTnhMMmhRT0dGYVJXOTVSV1JUYlhCR1RVUnJQUWRnVFVWUlEwbEZlV3BXZEhKTlZXWnNaRlpHWkZBMlJIZDNkV3hVVUd4V2RHVTFVSGRzWmpkd2NpdEJkbTR2SzFneFFXbEJkRmRsTUVoQ1FVNU5NMFZvZERSbEwxUXhNamxXVFN0WmNWVXJaVGRUWVRKbVpXWmtNWFZYU0VORFFUMDlDRmd3VmpBUUJnY3Foa2pPUFFJQkJnVXJnUVFBQ2dOQ0FBUkJlUU43ejVnVXFjMnk2TmtDMjI0d2VXaUVIVk9hQ1FEa2VKK2RoWVozQTM0RmJnanJGemtyVHVPcHFxQWkrRC9CS09LblFxSXJlMjVPaGhOQi96TUE8L2NiYzpFbWJlZGRlZERvY3VtZW50QmluYXJ5T2JqZWN0PgogICAgICAgIDwvY2FjOkF0dGFjaG1lbnQ+CjwvY2FjOkFkZGl0aW9uYWxEb2N1bWVudFJlZmVyZW5jZT48Y2FjOlNpZ25hdHVyZT4KICAgICAgPGNiYzpJRD51cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2lnbmF0dXJlOkludm9pY2U8L2NiYzpJRD4KICAgICAgPGNiYzpTaWduYXR1cmVNZXRob2Q+dXJuOm9hc2lzOm5hbWVzOnNwZWNpZmljYXRpb246dWJsOmRzaWc6ZW52ZWxvcGVkOnhhZGVzPC9jYmM6U2lnbmF0dXJlTWV0aG9kPgo8L2NhYzpTaWduYXR1cmU+PGNhYzpBY2NvdW50aW5nU3VwcGxpZXJQYXJ0eT4KICAgICAgICA8Y2FjOlBhcnR5PgogICAgICAgICAgICA8Y2FjOlBhcnR5SWRlbnRpZmljYXRpb24+CiAgICAgICAgICAgICAgICA8Y2JjOklEIHNjaGVtZUlEPSJDUk4iPjEwMTAwMTAwMDA8L2NiYzpJRD4KICAgICAgICAgICAgPC9jYWM6UGFydHlJZGVudGlmaWNhdGlvbj4KICAgICAgICAgICAgPGNhYzpQb3N0YWxBZGRyZXNzPgogICAgICAgICAgICAgICAgPGNiYzpTdHJlZXROYW1lPkVxdWlwbWVudCBQYXJ0cyBFeHBlcnRzIFRyYWRpbmcgQ28uPC9jYmM6U3RyZWV0TmFtZT4KICAgICAgICAgICAgICAgIDxjYmM6QnVpbGRpbmdOdW1iZXI+MjMyMjwvY2JjOkJ1aWxkaW5nTnVtYmVyPgogICAgICAgICAgICAgICAgPGNiYzpDaXR5U3ViZGl2aXNpb25OYW1lPkFsIEphd2hhcmE8L2NiYzpDaXR5U3ViZGl2aXNpb25OYW1lPgogICAgICAgICAgICAgICAgPGNiYzpDaXR5TmFtZT5SaXlhZGg8L2NiYzpDaXR5TmFtZT4KICAgICAgICAgICAgICAgIDxjYmM6UG9zdGFsWm9uZT43NTgwMDwvY2JjOlBvc3RhbFpvbmU+CiAgICAgICAgICAgICAgICA8Y2FjOkNvdW50cnk+CiAgICAgICAgICAgICAgICAgICAgPGNiYzpJZGVudGlmaWNhdGlvbkNvZGU+U0E8L2NiYzpJZGVudGlmaWNhdGlvbkNvZGU+CiAgICAgICAgICAgICAgICA8L2NhYzpDb3VudHJ5PgogICAgICAgICAgICA8L2NhYzpQb3N0YWxBZGRyZXNzPgogICAgICAgICAgICA8Y2FjOlBhcnR5VGF4U2NoZW1lPgogICAgICAgICAgICAgICAgPGNiYzpDb21wYW55SUQ+MzExMDA3MTQxNjAwMDAzPC9jYmM6Q29tcGFueUlEPgogICAgICAgICAgICAgICAgPGNhYzpUYXhTY2hlbWU+CiAgICAgICAgICAgICAgICAgICAgPGNiYzpJRD5WQVQ8L2NiYzpJRD4KICAgICAgICAgICAgICAgIDwvY2FjOlRheFNjaGVtZT4KICAgICAgICAgICAgPC9jYWM6UGFydHlUYXhTY2hlbWU+CiAgICAgICAgICAgIDxjYWM6UGFydHlMZWdhbEVudGl0eT4KICAgICAgICAgICAgICAgIDxjYmM6UmVnaXN0cmF0aW9uTmFtZT5FcXVpcG1lbnQgUGFydHMgRXhwZXJ0cyBUcmFkaW5nIENvLjwvY2JjOlJlZ2lzdHJhdGlvbk5hbWU+CiAgICAgICAgICAgIDwvY2FjOlBhcnR5TGVnYWxFbnRpdHk+CiAgICAgICAgPC9jYWM6UGFydHk+CiAgICA8L2NhYzpBY2NvdW50aW5nU3VwcGxpZXJQYXJ0eT4KICAgICA8Y2FjOkFjY291bnRpbmdDdXN0b21lclBhcnR5PgogICAgICAgIDxjYWM6UGFydHk+CiAgICAgICAgICAgIDxjYWM6UG9zdGFsQWRkcmVzcz4KICAgICAgICAgICAgICAgIDxjYmM6U3RyZWV0TmFtZT7Zhdik2LPYs9mHINi52YXYp9ivINi52KjYr9in2YTZhNmHINin2YTZhdiy2LHZiNi52Yog2YTZhNiq2LfZiNmK2LEg2KfZhNi52YLYp9ix2Yo8L2NiYzpTdHJlZXROYW1lPgogICAgICAgICAgICAgICAgPGNiYzpCdWlsZGluZ051bWJlcj4xMTkwPC9jYmM6QnVpbGRpbmdOdW1iZXI+CiAgICAgICAgICAgICAgICA8Y2JjOkNpdHlTdWJkaXZpc2lvbk5hbWU+2KfZhNmF2LHZiNisIHwgQWwtTXVyb29qPC9jYmM6Q2l0eVN1YmRpdmlzaW9uTmFtZT4KICAgICAgICAgICAgICAgIDxjYmM6Q2l0eU5hbWU+2KfZhNix2YrYp9i2IHwgUml5YWRoPC9jYmM6Q2l0eU5hbWU+CiAgICAgICAgICAgICAgICA8Y2JjOlBvc3RhbFpvbmU+MTIyMjI8L2NiYzpQb3N0YWxab25lPgogICAgICAgICAgICAgICAgPGNhYzpDb3VudHJ5PgogICAgICAgICAgICAgICAgICAgIDxjYmM6SWRlbnRpZmljYXRpb25Db2RlPlNBPC9jYmM6SWRlbnRpZmljYXRpb25Db2RlPgogICAgICAgICAgICAgICAgPC9jYWM6Q291bnRyeT4KICAgICAgICAgICAgPC9jYWM6UG9zdGFsQWRkcmVzcz4KICAgICAgICAgICAgPGNhYzpQYXJ0eVRheFNjaGVtZT4KICAgICAgICAgICAgICAgIDxjYmM6Q29tcGFueUlEPjMwMDc5MTk5ODIwMDAwMzwvY2JjOkNvbXBhbnlJRD4KICAgICAgICAgICAgICAgIDxjYWM6VGF4U2NoZW1lPgogICAgICAgICAgICAgICAgICAgIDxjYmM6SUQ+VkFUPC9jYmM6SUQ+CiAgICAgICAgICAgICAgICA8L2NhYzpUYXhTY2hlbWU+CiAgICAgICAgICAgIDwvY2FjOlBhcnR5VGF4U2NoZW1lPgogICAgICAgICAgICA8Y2FjOlBhcnR5TGVnYWxFbnRpdHk+CiAgICAgICAgICAgICAgICA8Y2JjOlJlZ2lzdHJhdGlvbk5hbWU+2YXYpNiz2LPZhyDYudmF2KfYryDYudio2K/Yp9mE2YTZhyDYp9mE2YXYstix2YjYudmKINmE2YTYqti32YjZitixINin2YTYudmC2KfYsdmKPC9jYmM6UmVnaXN0cmF0aW9uTmFtZT4KICAgICAgICAgICAgPC9jYWM6UGFydHlMZWdhbEVudGl0eT4KICAgICAgICA8L2NhYzpQYXJ0eT4KICAgIDwvY2FjOkFjY291bnRpbmdDdXN0b21lclBhcnR5PgogICAgPGNhYzpEZWxpdmVyeT4KICAgIDxjYmM6QWN0dWFsRGVsaXZlcnlEYXRlPjIwMjQtMDYtMDE8L2NiYzpBY3R1YWxEZWxpdmVyeURhdGU+CiAgICA8L2NhYzpEZWxpdmVyeT4KICAgIDxjYWM6UGF5bWVudE1lYW5zPgogICAgICAgIDxjYmM6UGF5bWVudE1lYW5zQ29kZT4xMDwvY2JjOlBheW1lbnRNZWFuc0NvZGU+CiAgICA8L2NhYzpQYXltZW50TWVhbnM+CiAgICA8Y2FjOkFsbG93YW5jZUNoYXJnZT4KICAgICAgICA8Y2JjOkNoYXJnZUluZGljYXRvcj5mYWxzZTwvY2JjOkNoYXJnZUluZGljYXRvcj4KICAgICAgICA8Y2JjOkFsbG93YW5jZUNoYXJnZVJlYXNvbj5kaXNjb3VudDwvY2JjOkFsbG93YW5jZUNoYXJnZVJlYXNvbj4KICAgICAgICA8Y2JjOkFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjAuMDA8L2NiYzpBbW91bnQ+CiAgICAgICAgPGNhYzpUYXhDYXRlZ29yeT4KICAgICAgICAgICAgPGNiYzpJRCBzY2hlbWVJRD0iVU4vRUNFIDUzMDUiIHNjaGVtZUFnZW5jeUlEPSI2Ij5TPC9jYmM6SUQ+CiAgICAgICAgICAgIDxjYmM6UGVyY2VudD4xNTwvY2JjOlBlcmNlbnQ+CiAgICAgICAgICAgIDxjYWM6VGF4U2NoZW1lPgogICAgICAgICAgICAgICAgPGNiYzpJRCBzY2hlbWVJRD0iVU4vRUNFIDUxNTMiIHNjaGVtZUFnZW5jeUlEPSI2Ij5WQVQ8L2NiYzpJRD4KICAgICAgICAgICAgPC9jYWM6VGF4U2NoZW1lPgogICAgICAgIDwvY2FjOlRheENhdGVnb3J5PgogICAgPC9jYWM6QWxsb3dhbmNlQ2hhcmdlPgogICAgPGNhYzpUYXhUb3RhbD4KICAgICAgICA8Y2JjOlRheEFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjQzLjQ0PC9jYmM6VGF4QW1vdW50PgogICAgPC9jYWM6VGF4VG90YWw+CiAgICA8Y2FjOlRheFRvdGFsPgogICAgICAgIDxjYmM6VGF4QW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+NDMuNDQ8L2NiYzpUYXhBbW91bnQ+CiAgICAgICAgPGNhYzpUYXhTdWJ0b3RhbD4KICAgICAgICAgICAgPGNiYzpUYXhhYmxlQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+Mjg5LjU5PC9jYmM6VGF4YWJsZUFtb3VudD4KICAgICAgICAgICAgPGNiYzpUYXhBbW91bnQgY3VycmVuY3lJRD0iU0FSIj40My40NDwvY2JjOlRheEFtb3VudD4KICAgICAgICAgICAgIDxjYWM6VGF4Q2F0ZWdvcnk+CiAgICAgICAgICAgICAgICAgPGNiYzpJRCBzY2hlbWVJRD0iVU4vRUNFIDUzMDUiIHNjaGVtZUFnZW5jeUlEPSI2Ij5TPC9jYmM6SUQ+CiAgICAgICAgICAgICAgICAgPGNiYzpQZXJjZW50PjE1LjAwPC9jYmM6UGVyY2VudD4KICAgICAgICAgICAgICAgIDxjYWM6VGF4U2NoZW1lPgogICAgICAgICAgICAgICAgICAgPGNiYzpJRCBzY2hlbWVJRD0iVU4vRUNFIDUxNTMiIHNjaGVtZUFnZW5jeUlEPSI2Ij5WQVQ8L2NiYzpJRD4KICAgICAgICAgICAgICAgIDwvY2FjOlRheFNjaGVtZT4KICAgICAgICAgICAgIDwvY2FjOlRheENhdGVnb3J5PgogICAgICAgIDwvY2FjOlRheFN1YnRvdGFsPgogICAgPC9jYWM6VGF4VG90YWw+CiAgICA8Y2FjOkxlZ2FsTW9uZXRhcnlUb3RhbD4KICAgICAgICA8Y2JjOkxpbmVFeHRlbnNpb25BbW91bnQgY3VycmVuY3lJRD0iU0FSIj4yODkuNTk8L2NiYzpMaW5lRXh0ZW5zaW9uQW1vdW50PgogICAgICAgIDxjYmM6VGF4RXhjbHVzaXZlQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+Mjg5LjU5PC9jYmM6VGF4RXhjbHVzaXZlQW1vdW50PgogICAgICAgIDxjYmM6VGF4SW5jbHVzaXZlQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+MzMzLjAzPC9jYmM6VGF4SW5jbHVzaXZlQW1vdW50PgogICAgICAgIDxjYmM6QWxsb3dhbmNlVG90YWxBbW91bnQgY3VycmVuY3lJRD0iU0FSIj4wLjAwPC9jYmM6QWxsb3dhbmNlVG90YWxBbW91bnQ+CiAgICAgICAgPGNiYzpQcmVwYWlkQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+MC4wMDwvY2JjOlByZXBhaWRBbW91bnQ+CiAgICAgICAgPGNiYzpQYXlhYmxlQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+MzMzLjAzPC9jYmM6UGF5YWJsZUFtb3VudD4KICAgIDwvY2FjOkxlZ2FsTW9uZXRhcnlUb3RhbD4KICAgIAogICAgICAgICAgICA8Y2FjOkludm9pY2VMaW5lPgogICAgICAgIDxjYmM6SUQ+MTwvY2JjOklEPgogICAgICAgIDxjYmM6SW52b2ljZWRRdWFudGl0eSB1bml0Q29kZT0iUENTIj4xLjAwPC9jYmM6SW52b2ljZWRRdWFudGl0eT4KICAgICAgICA8Y2JjOkxpbmVFeHRlbnNpb25BbW91bnQgY3VycmVuY3lJRD0iU0FSIj41NC4yNDwvY2JjOkxpbmVFeHRlbnNpb25BbW91bnQ+CiAgICAgICAgPGNhYzpUYXhUb3RhbD4KICAgICAgICAgICAgIDxjYmM6VGF4QW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+OC4xNDwvY2JjOlRheEFtb3VudD4KICAgICAgICAgICAgIDxjYmM6Um91bmRpbmdBbW91bnQgY3VycmVuY3lJRD0iU0FSIj42Mi4zODwvY2JjOlJvdW5kaW5nQW1vdW50PgogICAgICAgIDwvY2FjOlRheFRvdGFsPgogICAgICAgIDxjYWM6SXRlbT4KICAgICAgICAgICAgPGNiYzpOYW1lPml0ZW1ubzwvY2JjOk5hbWU+CiAgICAgICAgICAgIDxjYWM6Q2xhc3NpZmllZFRheENhdGVnb3J5PgogICAgICAgICAgICAgICAgPGNiYzpJRD5TPC9jYmM6SUQ+CiAgICAgICAgICAgICAgICA8Y2JjOlBlcmNlbnQ+MTUuMDA8L2NiYzpQZXJjZW50PgogICAgICAgICAgICAgICAgPGNhYzpUYXhTY2hlbWU+CiAgICAgICAgICAgICAgICAgICAgPGNiYzpJRD5WQVQ8L2NiYzpJRD4KICAgICAgICAgICAgICAgIDwvY2FjOlRheFNjaGVtZT4KICAgICAgICAgICAgPC9jYWM6Q2xhc3NpZmllZFRheENhdGVnb3J5PgogICAgICAgIDwvY2FjOkl0ZW0+CiAgICAgICAgPGNhYzpQcmljZT4KICAgICAgICAgICAgPGNiYzpQcmljZUFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjU0LjI0PC9jYmM6UHJpY2VBbW91bnQ+CiAgICAgICAgICAgIDxjYWM6QWxsb3dhbmNlQ2hhcmdlPgogICAgICAgICAgICAgICA8Y2JjOkNoYXJnZUluZGljYXRvcj50cnVlPC9jYmM6Q2hhcmdlSW5kaWNhdG9yPgogICAgICAgICAgICAgICA8Y2JjOkFsbG93YW5jZUNoYXJnZVJlYXNvbj5kaXNjb3VudDwvY2JjOkFsbG93YW5jZUNoYXJnZVJlYXNvbj4KICAgICAgICAgICAgICAgPGNiYzpBbW91bnQgY3VycmVuY3lJRD0iU0FSIj4wLjAwPC9jYmM6QW1vdW50PgogICAgICAgICAgICA8L2NhYzpBbGxvd2FuY2VDaGFyZ2U+CiAgICAgICAgPC9jYWM6UHJpY2U+CiAgICA8L2NhYzpJbnZvaWNlTGluZT4KPC9JbnZvaWNlPg==';
    } catch (error) {
        console.log('error in dummy api', error);
    }
}

module.exports = {
    getOrganizationData,
    ConfigureCertificate,
    getCSR,
    complianceCSIDGenerate,
    onboardingCSIDGenerate,
    signXML,
    generatePhaseTwoQr,
    generateInvoiceHash,
    generateInvoiceJSON,
    ReportInvoice,
    ClearInvoice,
    UpdateDocumentNo,
    DummyApi,
    getCounterNumber,
};
