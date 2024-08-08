'use strict';

const { default: axios } = require('axios');
const fs = require('fs');

const { xmlGenerator } = require('../../utils/util-xml');
const {
    getOrganizationData,
    getCSR,
    complianceCSIDGenerate,
    onboardingCSIDGenerate,
    signXML,
    generatePhaseTwoQr,
    generateInvoiceHash,
    generateInvoiceJSON,
    ReportInvoice,
    UpdateDocumentNo,
    // generateInvoiceHash,
} = require('../../utils/invoicing_controller');
const { saveReporting } = require('../../utils/data_saving/reportingResponse');
const { saveClearance } = require('../../utils/data_saving/clearanceResponse');
const numberRangeConfigModel = require('../../models/miscellaneous/numberRangeConfig');
const syncInvoiceModel = require('../../models/SyncInvoice/SyncInvoiceModel');
const removeFromSync = require('../../utils/data_delete/delete_invoice');
// const generatePhaseTwoQr = require('../../utils/generatePhaseTwoQr');

const zatca_sync_invoicing = async (req, res) => {
    let authorization = req?.headers?.authorization;
    let authorizationserver = `Basic ${Buffer.from(
        `${process.env.usernameonboarding}:${process.env.password}`,
    )?.toString('base64')}`;

    if (!authorization && !authorizationserver) {
        res.status(401).json({ message: 'Missing authorization from header or env' });
        return;
    } else {
        console.log('authorization is getting');
    }
    if (authorization) {
        console.log('Taking Authorization from header');
        req.headers.authorization = authorization;
    } else if (authorizationserver && !authorization) {
        console.log('Taking Authorization from server env');
        req.headers.authorization = authorizationserver;
    }

    // return;

    console.log('zatca_sync_invoicing controller start');

    // const invoice = await req.body;
    const data = await syncInvoiceModel.findOne({});
    if (!data) {
        console.log('Sync Attempted, Invoices Not Available in Sync Collection');
        res.status(400).json({
            message: 'Sync Attempted, Invoices Not Available in Sync Collection',
            warning: false,
            status: true,
        });
        return;
    } else {
        console.log('Got Data in Sync Collection  Attempting on it');
    }

    const invoice = data?.data;

    invoice.oldardocumentno = await invoice?.ardocumentno;
    invoice.oldcounter = await invoice?.counter;
    const { counterInc, prefixnumber, suffixInc } = await UpdateDocumentNo(invoice);
    console.log(counterInc, prefixnumber, suffixInc);

    invoice.counter = counterInc;
    invoice.ardocumentno = prefixnumber + suffixInc;

    const Standard = invoice?.typecode == '01' || invoice?.typecode == '1';
    if (!invoice.typecode) {
        await saveReporting({
            success: false,
            ardocumentno: invoice?.ardocumentno,
            counter: invoice?.counter,
            transactionlayerno: invoice?.transactionlayerno,
            response: `typecode is missing in body data`,
        });
        res.status(400).json({
            message: 'typecode is missing in body data ',
            warning: true,
            status: false,
        });
    }
    if (!invoice.counter) {
        await saveReporting({
            success: false,
            counter: invoice?.counter,
            ardocumentno: invoice?.ardocumentno,
            transactionlayerno: invoice?.transactionlayerno,
            response: `counter is missing in body data`,
        });

        res.status(400).json({
            message: 'counter is missing in body data ',
            warning: true,
            status: false,
        });
    }
    try {
        if (!Standard) {
            // Getting Organization for fetching or creating new CSR
            const organizationData = await getOrganizationData(invoice);
            if (!organizationData) {
                throw new Error('No Organization available with this cocode or retailstoreno');
            }

            const generatedXML = await xmlGenerator(invoice, organizationData, Standard);
            if (!generatedXML?.success) {
                throw new Error('Failed to generate XML.');
            }

            const signedXML = await signXML(generatedXML?.unsignedPath, generatedXML?.signedPath);
            if (!signedXML) {
                throw new Error('Failed to sign generated XML.');
            } else {
                console.log('Sucess signed , Now going to QR generation');
            }

            const QrBase64 = await generatePhaseTwoQr(signedXML);
            if (!QrBase64) {
                throw new Error('Failed to generate QR code from signed xml invoice.');
            }

            const invoiceHash = await generateInvoiceHash(signedXML);
            if (!invoiceHash) {
                throw new Error('Failed to generate hash from invoice xml.');
            }

            const InvoiceJSON = await generateInvoiceJSON(signedXML, generatedXML?.randomNo);
            if (!InvoiceJSON) {
                throw new Error('Failed to generate invoice JSON.');
            } else {
                console.log('InvoiceJSON Value is coming');
            }

            let Reported = await ReportInvoice(InvoiceJSON, req?.headers?.authorization);
            if (Reported) {
                try {
                    const numberRangeSaving = await numberRangeConfigModel.findOneAndUpdate(
                        {},
                        {
                            counter: invoice.counter,
                            suffix: suffixInc,
                            prefix: prefixnumber,
                            documentno: invoice.ardocumentno,
                        },
                        { new: true },
                    );
                    console.log('numberRangeSaving', numberRangeSaving);

                    await removeFromSync(invoice?.oldardocumentno);
                } catch (error) {
                    throw new Error(error);
                }
            }

            await saveReporting({
                success: true,
                counter: invoice?.counter,
                ardocumentno: invoice?.ardocumentno,
                transactionlayerno: invoice?.transactionlayerno,
                qr: QrBase64,
                xml: generatedXML?.signedPath,
                response: Reported,
            });
            res.status(200).json({
                response: { data: QrBase64, report: Reported, xml: generatedXML?.signedPath },
                status: true,
                message: 'Invoice has been signed and reported successfully',
                warning: false,
            });

            // if (Reported.message === 'getaddrinfo ENOTFOUND gw-fatoora.zatca.gov.sa') {
            //     Reported = await ReportInvoice(InvoiceJSON);
            //     if (!Reported) {
            //         throw new Error('Failed to Report Invoice on 2nd attempt.');
            //     } else {
            //         console.log('returnd no 0IFR');
            //         await saveReporting({
            //             success: true,
            //             oldardocumentno: invoice?.oldardocumentno,
            //             oldcounter: invoice?.oldcounter,
            //             counter: invoice?.counter,
            //             ardocumentno: invoice?.ardocumentno,
            //             transactionlayerno: invoice?.transactionlayerno,
            //             qr: QrBase64,
            //             xml: generatedXML?.signedPath,
            //             response: Reported,
            //         });

            //         res.status(200).json({
            //             response: { data: QrBase64, report: Reported, xml: generatedXML?.signedPath },
            //             status: true,
            //             message: 'Invoice has been signed and reported successfully',
            //             warning: false,
            //         });
            //         console.log('reported on 2nd attempt');
            //     }
            //     return;
            // } else if (!Reported) {
            //     throw new Error('Faild to Report Invoice on 1st attempt.');
            // } else {
            //     await saveReporting({
            //         success: true,
            //         oldardocumentno: invoice?.oldardocumentno,
            //         oldcounter: invoice?.oldcounter,
            //         counter: invoice?.counter,
            //         ardocumentno: invoice?.ardocumentno,
            //         transactionlayerno: invoice?.transactionlayerno,
            //         qr: QrBase64,
            //         xml: generatedXML?.signedPath,
            //         response: Reported,
            //     });
            //     res.status(200).json({
            //         response: { data: QrBase64, report: Reported, xml: generatedXML?.signedPath },
            //         status: true,
            //         message: 'Invoice has been signed and reported successfully',
            //         warning: false,
            //     });
            //     console.log('reported on 1st attempt');
            //     return;
            // }
        } else {
            // //////////// Standard ///////////// //

            const organizationData = await getOrganizationData(invoice);
            if (!organizationData) {
                throw new Error('Faild to get organization, with this cocode/retailstoreno');
            }

            const generatedXML = await xmlGenerator(invoice, organizationData, Standard);
            if (!generatedXML) {
                throw new Error('Failed to generate XML file');
            }

            const signStandardPath = `public/files/xmls/standard/signed/cleared_invoice_${generatedXML?.randomNo}.xml`;
            let InvoiceJSON = await generateInvoiceJSON(generatedXML?.unsignedPath, generatedXML?.randomNo, Standard)
                .then(generateInvoiceJSON => {
                    return generateInvoiceJSON;
                })
                .catch(error => {
                    throw new Error('Failed to generate invoice JSON', error);
                });

            const gettingInvoiceHash = await generateInvoiceHash(generatedXML?.unsignedPath)
                .then(data => {
                    InvoiceJSON.invoiceHash = data;
                    return InvoiceJSON;
                })
                .catch(error => {
                    throw new Error('Failed to generate hash from invoice xml.', error);
                });

            const makeRequest = async (data, authorization) => {
                try {
                    // console.log("data inside makeRequest func", data)
                    const response = await fetch(
                        'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/invoices/clearance/single',
                        {
                            method: 'POST',
                            body: JSON.stringify(data),
                            headers: {
                                // Authorization: `Basic ${Buffer.from(
                                //     `TUlJRkJUQ0NCS3VnQXdJQkFnSVRFd0FBUk5rWVFJOGg3NkZ0WlFBQkFBQkUyVEFLQmdncWhrak9QUVFEQWpCaU1SVXdFd1lLQ1pJbWlaUHlMR1FCR1JZRmJHOWpZV3d4RXpBUkJnb0praWFKay9Jc1pBRVpGZ05uYjNZeEZ6QVZCZ29Ka2lhSmsvSXNaQUVaRmdkbGVIUm5ZWHAwTVJzd0dRWURWUVFERXhKUVJWcEZTVTVXVDBsRFJWTkRRVEl0UTBFd0hoY05NalF3TlRNd01EVTFOelUyV2hjTk1qWXdOVE13TURZd056VTJXakJzTVFzd0NRWURWUVFHRXdKVFFURWpNQ0VHQTFVRUNoTWFSbWxzZEdWeWN5QkZlSEJsY25SeklGUnlZV1JwYm1jZ1EyOHhEekFOQmdOVkJBc1RCa3BsWkdSaGFERW5NQ1VHQTFVRUF4TWVSa1ZVTFRRd016QXlNamd4TkRrdE16RXhNREEzTVRReE5qQXdNREF6TUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVRWGtEZTgrWUZLbk5zdWpaQXR0dU1IbG9oQjFUbWdrQTVIaWZuWVdHZHdOK0JXNEk2eGM1SzA3anFhcWdJdmcvd1NqaXAwS2lLM3R1VG9ZVFFmOHpBS09DQXpjd2dnTXpNSUdoQmdOVkhSRUVnWmt3Z1pha2daTXdnWkF4T3pBNUJnTlZCQVFNTWpFdFJrVlVmREl0UmtWVWZETXRaV1UxT0dVNFkyTXRaVEJsWmkwMFlUZzJMVGcwTWprdFlqZGtObU15WldJNE4yVmpNUjh3SFFZS0NaSW1pWlB5TEdRQkFRd1BNekV4TURBM01UUXhOakF3TURBek1RMHdDd1lEVlFRTURBUXhNVEF3TVE4d0RRWURWUVFhREFaS1pXUmtZV2d4RURBT0JnTlZCQThNQjFSeVlXUnBibWN3SFFZRFZSME9CQllFRkoyV25oVVlpbkdWSUdKUi9la3dKT3RiMUJNV01COEdBMVVkSXdRWU1CYUFGSUh5bzN0eWU3MVFvMnFmOGVqVGpkWjduSEMxTUlIbEJnTlZIUjhFZ2Qwd2dkb3dnZGVnZ2RTZ2dkR0dnYzVzWkdGd09pOHZMME5PUFZCRldrVkpUbFpQU1VORlUwTkJNaTFEUVNneEtTeERUajFRVWxwRlNVNVdUMGxEUlZCTFNUSXNRMDQ5UTBSUUxFTk9QVkIxWW14cFl5VXlNRXRsZVNVeU1GTmxjblpwWTJWekxFTk9QVk5sY25acFkyVnpMRU5PUFVOdmJtWnBaM1Z5WVhScGIyNHNSRU05WlhoMGVtRjBZMkVzUkVNOVoyOTJMRVJEUFd4dlkyRnNQMk5sY25ScFptbGpZWFJsVW1WMmIyTmhkR2x2Ymt4cGMzUS9ZbUZ6WlQ5dlltcGxZM1JEYkdGemN6MWpVa3hFYVhOMGNtbGlkWFJwYjI1UWIybHVkRENCemdZSUt3WUJCUVVIQVFFRWdjRXdnYjR3Z2JzR0NDc0dBUVVGQnpBQ2hvR3ViR1JoY0Rvdkx5OURUajFRUlZwRlNVNVdUMGxEUlZORFFUSXRRMEVzUTA0OVFVbEJMRU5PUFZCMVlteHBZeVV5TUV0bGVTVXlNRk5sY25acFkyVnpMRU5PUFZObGNuWnBZMlZ6TEVOT1BVTnZibVpwWjNWeVlYUnBiMjRzUkVNOVpYaDBlbUYwWTJFc1JFTTlaMjkyTEVSRFBXeHZZMkZzUDJOQlEyVnlkR2xtYVdOaGRHVS9ZbUZ6WlQ5dlltcGxZM1JEYkdGemN6MWpaWEowYVdacFkyRjBhVzl1UVhWMGFHOXlhWFI1TUE0R0ExVWREd0VCL3dRRUF3SUhnREE4QmdrckJnRUVBWUkzRlFjRUx6QXRCaVVyQmdFRUFZSTNGUWlCaHFnZGhORDdFb2J0blNTSHp2c1owOEJWWm9HYzJDMkQ1Y1ZkQWdGa0FnRVFNQjBHQTFVZEpRUVdNQlFHQ0NzR0FRVUZCd01DQmdnckJnRUZCUWNEQXpBbkJna3JCZ0VFQVlJM0ZRb0VHakFZTUFvR0NDc0dBUVVGQndNQ01Bb0dDQ3NHQVFVRkJ3TURNQW9HQ0NxR1NNNDlCQU1DQTBnQU1FVUNJREhmc21rdzJPMW1WdHcxRldmbTIxTEZVQXNEMUtRb2dRc2dFdldKT3A2aEFpRUFxeGRuRTVpclBXYkU0SWNFVjlpOU0wTlNCcHFVb3V6VmxvK0dzVXpoWndzPQ==:bTdRfHQkUWJyVgwNKGrOVlCD6zUSHd+W2X0fktfw7IQ=`,
                                // )?.toString('base64')}`,
                                Authorization: authorization,
                                'Accept-Version': 'V2',
                                'Accept-Language': 'en',
                                'Content-Type': 'application/json',
                            },
                        },
                    );

                    return response?.json();
                } catch (error) {
                    throw new Error('Failed to post fatoora api', error);
                }
            };
            const InvoiceCleared = await makeRequest(gettingInvoiceHash, req?.headers?.authorization);
            if (InvoiceCleared) {
                try {
                    const numberRangeSaving = await numberRangeConfigModel.findOneAndUpdate(
                        {},
                        {
                            counter: invoice.counter,
                            suffix: suffixInc,
                            prefix: prefixnumber,
                            documentno: invoice.ardocumentno,
                        },
                        { new: true },
                    );
                    console.log('numberRangeSaving in clearance', numberRangeSaving);
                } catch (error) {
                    throw new Error(error);
                }
            }

            const base64Decode = async base64 => {
                console.log('conversion start');
                try {
                    return Buffer.from(base64, 'base64')?.toString('utf-8');
                } catch (e) {
                    console.error('Invalid base64 string', e);
                    return null;
                }
            };
            const xmlData = await base64Decode(InvoiceCleared?.clearedInvoice);
            if (!xmlData) {
                throw new Error('Faild to decode base64 data from clearance api response');
            }

            const saveXMLToFile = async (xmlString, fileName) => {
                try {
                    fs.writeFile(fileName, xmlString, err => {
                        if (err) {
                            console.log('XML file not save successfully');
                            return;
                        } else {
                            console.log('XML generated successfully');
                        }
                    });
                    return true;
                } catch (error) {
                    throw new Error('Failed to save signed (clearance) XML file', error);
                    return false;
                }
            };
            const xmlGenerated = await saveXMLToFile(xmlData, signStandardPath);
            if (!xmlGenerated) {
                throw new Error('Faild to save XML data in XML file ');
            }

            const QrBase64 = await generatePhaseTwoQr(signStandardPath);
            if (!QrBase64) {
                throw new Error('Failed to generate QR code');
            }

            if (InvoiceCleared) {
                saveClearance({
                    success: true,

                    counter: invoice?.counter,
                    ardocumentno: invoice?.ardocumentno,
                    oldardocumentno: invoice?.oldardocumentno,
                    oldcounter: invoice?.oldcounter,
                    invoiceObject: invoice,
                    transactionlayerno: invoice?.transactionlayerno,
                    qr: QrBase64,
                    xml: generatedXML?.signedPath,
                    response: InvoiceCleared,
                });
                await removeFromSync(invoice?.oldardocumentno);
            } else {
                throw new Error('Faild to clear invoice');
            }

            res.status(200).json({
                status: true,
                message: 'Invoice has been cleared and QR attached successfully',

                response: {
                    data: QrBase64,
                    clearance: InvoiceCleared,
                    xmlpath: signStandardPath,
                    counter: invoice?.counter,
                },
                warning: false,
            });
            return;
        }
    } catch (error) {
        console.log('Error in invoicing route:', error);
        console.log('Error message:', error.message);

        if (Standard) {
            saveClearance({
                success: false,
                ardocumentno: invoice?.ardocumentno,
                oldardocumentno: invoice?.oldardocumentno,
                oldcounter: invoice?.oldcounter,
                invoiceObject: invoice,
                transactionlayerno: invoice?.transactionlayerno,
                response: error.message,
                counter: invoice?.counter,
            });
            res.status(500).json({ error: 'Faild to clear invoice :  server error', message: error.message });
        } else {
            await saveReporting({
                success: false,
                counter: invoice?.counter,
                ardocumentno: invoice?.ardocumentno,
                oldardocumentno: invoice?.oldardocumentno,
                oldcounter: invoice?.oldcounter,
                invoiceObject: invoice,
                transactionlayerno: invoice?.transactionlayerno,
                response: error.message,
            });
            res.status(500).json({ message: 'Faild to report invoice :  server error', message: error.message });
        }
    }
};

module.exports = zatca_sync_invoicing;
