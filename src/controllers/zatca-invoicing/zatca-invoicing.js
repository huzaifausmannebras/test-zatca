'use strict';

const { default: axios } = require('axios');
const fs = require('fs');
const { default: mongoose } = require('mongoose');

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
    ClearInvoice,
    ConfigureCertificate,
    // generateInvoiceHash,
} = require('../../utils/invoicing_controller');
const { saveReporting } = require('../../utils/data_saving/reportingResponse');
const { saveClearance } = require('../../utils/data_saving/clearanceResponse');
const numberRangeConfigModel = require('../../models/miscellaneous/numberRangeConfig');
const { error } = require('console');
// const generatePhaseTwoQr = require('../../utils/generatePhaseTwoQr');

const zatca_invoicing = async (req, res) => {
    //
    console.log('zatca_invoicing controller start');

    if (!req.headers.authorization) {
        res.status(401).json({ data: {}, warning: false, status: false, message: 'missing required authorization' });
    }

    const invoice = await req.body;
    invoice.oldardocumentno = invoice?.ardocumentno;
    invoice.oldcounter = invoice?.counter;

    const { counterInc, prefixnumber, suffixInc } = await UpdateDocumentNo(invoice);
    console.log(counterInc, prefixnumber, suffixInc);

    invoice.counter = counterInc;
    invoice.ardocumentno = prefixnumber + suffixInc;

    const Standard = invoice?.typecode == '01' || invoice?.typecode == '1';
    if (!invoice.typecode) {
        await saveReporting({
            success: false,
            counter: invoice?.counter,
            oldcounter: invoice?.oldcounter,
            oldardocumentno: invoice?.oldardocumentno,
            invoiceObject: invoice,

            ardocumentno: invoice?.ardocumentno,
            transactionlayerno: invoice?.transactionlayerno,
            response: `typecode is missing in body data`,
        });
        res.status(400).json({
            data: {},
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
            oldcounter: invoice?.oldcounter,
            oldardocumentno: invoice?.oldardocumentno,
            transactionlayerno: invoice?.transactionlayerno,
            invoiceObject: invoice,

            response: `counter is missing in body data`,
        });

        res.status(400).json({
            data: {},
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
            const vatNumber = organizationData?.location[0]?.organizationIdentifier;

            const generatedXML = await xmlGenerator(invoice, organizationData, Standard);
            if (!generatedXML?.success) {
                throw new Error('Failed to generate XML.' + ' ' + error.message);
            }

            const certConfigured = await ConfigureCertificate(organizationData, Standard);
            if (!certConfigured) {
                throw new Error('Failed to setup configuration (certificate for the organization).' + ' ' + error.message);
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

            const invoiceHash = await generateInvoiceHash(signedXML,organizationData);
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

            // Increament in counter

            if (Reported?.status == 200 || Reported?.status == 202) {
                let session;
                try {
                    session = await mongoose.startSession();
                    session.startTransaction();

                    const numberRangeSaving = await numberRangeConfigModel.findOneAndUpdate(
                        {},
                        {
                            counter: invoice?.counter,
                            suffix: suffixInc,
                            prefix: prefixnumber,
                            documentno: invoice?.ardocumentno,
                        },
                        { new: true },
                    );
                    await session.commitTransaction();

                    console.log('numberRangeSaving', numberRangeSaving);
                } catch (error) {
                    await session.abortTransaction();
                    throw new Error('faild to update invoice counter', error);
                } finally {
                    await session.endSession(); // Ensure session cleanup in all paths
                }
            } else {
                throw new Error('Faild to Report Invoice Issue in (Reporting API) ');
            }

            await saveReporting({
                success: true,
                counter: invoice?.counter,
                ardocumentno: invoice?.ardocumentno,
                oldcounter: invoice?.oldcounter,
                oldardocumentno: invoice?.oldardocumentno,
                transactionlayerno: invoice?.transactionlayerno,
                qr: QrBase64,
                xml: generatedXML?.signedPath,
                invoiceObject: invoice,
                response: Reported?.data,
            });
            res.status(200).json({
                response: {
                    data: QrBase64,
                    report: Reported?.data,
                    xml: generatedXML?.signedPath,
                    transactionno: invoice.oldardocumentno,
                    transactionlayer: invoice.transactionlayerno,
                    processcode: invoice.processcode,
                    vatnumber: vatNumber ? vatNumber : organizationData?.organizationIdentifier,
                    refrowuid: invoice.rowuid,
                },
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
            //             message: 'Invoice has been signed and reported successfully fitst',
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
            //         message: 'Invoice has been signed and reported successfully 2nd',
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
            const vatNumber = organizationData?.location[0]?.organizationIdentifier;
            
            
            
            const generatedXML = await xmlGenerator(invoice, organizationData, Standard);
            if (!generatedXML) {
                throw new Error('Failed to generate XML file');
            }
            

            const unsignedStandardPath = `public/files/${organizationData.organizationIdentifier}/xmls/standard/unsigned/cleared_invoice_${generatedXML?.randomNo}.xml`;
            const signStandardPath = `public/files/${organizationData.organizationIdentifier}/xmls/standard/signed/cleared_invoice_${generatedXML?.randomNo}.xml`;

            
            const certConfigured = await ConfigureCertificate(organizationData, Standard);
            if (!certConfigured) {
                throw new Error('Failed to setup configuration (certificate for the organization).' + ' ' + error.message);
            }


            
            
            
            let InvoiceJSON = await generateInvoiceJSON(generatedXML?.unsignedPath, generatedXML?.randomNo, Standard)
                .then(generateInvoiceJSON => {
                    return generateInvoiceJSON;
                })
                .catch(error => {
                    throw new Error('Failed to generate invoice JSON', error);
                });

            const gettingInvoiceHash = await generateInvoiceHash(generatedXML?.unsignedPath,organizationData)
                .then(data => {
                    InvoiceJSON.invoiceHash = data;
                    return InvoiceJSON;
                })
                .catch(error => {
                    throw new Error('Failed to generate hash from invoice xml.', error);
                });
            if (!gettingInvoiceHash) {
                throw new Error('Faild to generate invoice Hash in function (gettingInvoiceHash');
            }

            const InvoiceCleared = await ClearInvoice(gettingInvoiceHash, req?.headers?.authorization);
            if (InvoiceCleared?.status == 200 || InvoiceCleared?.status == 202) {
                let session;
                try {
                    session = await mongoose.startSession();
                    session.startTransaction();

                    const numberRangeSaving = await numberRangeConfigModel.findOneAndUpdate(
                        {},
                        {
                            counter: invoice?.counter,
                            suffix: suffixInc,
                            prefix: prefixnumber,
                            documentno: invoice?.ardocumentno,
                        },
                        { new: true },
                    );
                    await session.commitTransaction();

                    console.log('numberRangeSaving', numberRangeSaving);
                } catch (error) {
                    await session.abortTransaction();
                    throw new Error('faild to update invoice counter', error);
                } finally {
                    await session.endSession(); // Ensure session cleanup in all paths
                }
            } else {
                throw new Error('Faild to Clear Invoice (issue in ClearInvoice() Api) ');
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
            const xmlData = await base64Decode(InvoiceCleared?.data?.clearedInvoice);
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

            if (InvoiceCleared?.data) {
                saveClearance({
                    success: true,
                    counter: invoice?.counter,
                    ardocumentno: invoice?.ardocumentno,
                    oldcounter: invoice?.oldcounter,
                    oldardocumentno: invoice?.oldardocumentno,
                    transactionlayerno: invoice?.transactionlayerno,
                    qr: QrBase64,
                    xml: generatedXML?.signedPath,
                    invoiceObject: invoice,
                    response: InvoiceCleared?.data,
                });
            } else {
                throw new Error('Faild to clear invoice');
            }

            res.status(200).json({
                status: true,
                message: 'Invoice has been cleared and QR attached successfully',
                response: {
                    data: QrBase64,
                    clearance: InvoiceCleared?.data,
                    xmlpath: signStandardPath,

                    transactionno: invoice.oldardocumentno,
                    transactionlayer: invoice.transactionlayerno,
                    processcode: invoice.processcode,
                    vatnumber: vatNumber ? vatNumber : organizationData?.organizationIdentifier,
                    refrowuid: invoice.rowuid,
                },
                warning: false,
            });

            return;
        }
    } catch (error) {
        console.log('Error in invoicing route:', error);
        console.log('Error message:', error.message);

        if (Standard) {
            await saveClearance({
                success: false,
                counter: '-',
                ardocumentno: '-',
                oldcounter: invoice?.oldcounter,
                oldardocumentno: invoice?.oldardocumentno,
                transactionlayerno: invoice?.transactionlayerno,
                invoiceObject: invoice,
                response: error.message,
            });
            res.status(500).json({
                status: false,
                data: {},
                warning: false,
                message: error.message,
            });
        } else {
            await saveReporting({
                success: false,
                counter: '-',
                ardocumentno: '-',
                oldcounter: invoice?.oldcounter,
                oldardocumentno: invoice?.oldardocumentno,
                transactionlayerno: invoice?.transactionlayerno,
                invoiceObject: invoice,
                response: error.message,
            });
            res.status(500).json({
                message: 'Faild to report invoice :  server error',
                status: false,
                warning: false,
                message: error.message,
            });
        }
    }
};

module.exports = zatca_invoicing;
