const fs = require('fs');
const fs_Prom = require('fs').promises;

const { v4: uuidv4 } = require('uuid');
const { signXML, generateInvoiceJSON } = require('./invoicing_controller');

const SimplifiedTaxInvoiceTemplate = require('./templates/simplified/SimplifiedTax');
const StandardTaxTemplate = require('./templates/standard/StandardTax');

const StandardTaxCredit = require('./templates/standard/StandardTax_Credit');
const StandardAdvancePayment = require('./templates/standard/AdvancePayment');
const StandardAdvancePaymentForeign = require('./templates/standard/AdvancePaymentForeignCurrency');
const StandardExempt = require('./templates/standard/Exempt');
const SimplifiedCreditTemplate = require('./templates/simplified/SimplifiedTax_Credit');

const xmlGenerator = async (body, organization, Standard) => {
    try {
        function generateUUID() {
            return uuidv4();
        }
        const uuid = generateUUID();

        const readFileAsync = () => {
            return new Promise((resolve, reject) => {
                fs.readFile(`public/cert/${organization.organizationIdentifier}/pih.txt`, 'utf8', (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                });
            });
        };
        const PIH = await readFileAsync();
        console.log('data in then', PIH);

        const test = '123';

        const organizationIdentifier =
            organization?.location[0]?.organizationIdentifier ?? organization?.organizationIdentifier;
        const AccountingSupplierParty = organization?.location[0];
        const data = { body, organization, AccountingSupplierParty, uuid, organizationIdentifier, PIH, test };

        let templatedData;
        if (Standard) {
            if (body?.processcode == 'ARCI') {
                console.log('using template Standard Tax Credit');
                templatedData = await StandardTaxCredit(data);
            } else if (body?.processcode == 'ARSI' || body?.processcode == 'ARDI') {

                if (body?.taxcode) {
                    console.log('using template for Exempt Tax');
                    templatedData = await StandardExempt(data);
                }

                else {
                    console.log('using template for standard Tax');
                    templatedData = await StandardTaxTemplate(data);
                }
            } else if (body?.processcode == 'ARGP') {
                if (body?.exchangerate > 1) {
                    console.log('Taking :StandardAdvancePaymentForeign');
                    templatedData = await StandardAdvancePaymentForeign(data);

                } else {
                    console.log('Taking :StandardAdvancePayments');
                    templatedData = await StandardAdvancePayment(data);
                }

            }
            else {
                throw new Error(
                    'Faild to get the valid processcode for xml generating , or xml template not saved against the process code',
                );
            }
            // s
        } else {
            if (body?.processcode == 'ARDI' || body?.processcode == 'ARSI') {
                console.log('taking as simplified tax invoice');
                templatedData = await SimplifiedTaxInvoiceTemplate(data);

            } else if (body?.processcode == 'ARCI') {
                console.log('generating simplified credit template ');
                templatedData = await SimplifiedCreditTemplate(data);
            }
        }

        // 
        const folderPath = `public/files/${organization?.organizationIdentifier}`;


        try {
            await fs_Prom.access(folderPath);
            console.log("xmls folder already exists");
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs_Prom.mkdir(folderPath, { recursive: true });
                // XML Folder and Inner 
                await fs_Prom.mkdir(`${folderPath}/xmls`, { recursive: true });

                await fs_Prom.mkdir(`${folderPath}/xmls/simplified`, { recursive: true });
                await fs_Prom.mkdir(`${folderPath}/xmls/simplified/generatedJSON`, { recursive: true });
                await fs_Prom.mkdir(`${folderPath}/xmls/simplified/signed`, { recursive: true });
                await fs_Prom.mkdir(`${folderPath}/xmls/simplified/unsigned`, { recursive: true });

                await fs_Prom.mkdir(`${folderPath}/xmls/standard`, { recursive: true });
                await fs_Prom.mkdir(`${folderPath}/xmls/standard/generatedJSON`, { recursive: true });
                await fs_Prom.mkdir(`${folderPath}/xmls/standard/unsigned`, { recursive: true });
                await fs_Prom.mkdir(`${folderPath}/xmls/standard/signed`, { recursive: true });
                // 

                // PDF Folder and Inner 
                await fs_Prom.mkdir(`${folderPath}/pdf`, { recursive: true });

                await fs_Prom.mkdir(`${folderPath}/pdf/attached_pdf_invoices`, { recursive: true });
                await fs_Prom.mkdir(`${folderPath}/pdf/attached_pdf_invoices/simplified`, { recursive: true });
                await fs_Prom.mkdir(`${folderPath}/pdf/attached_pdf_invoices/standard`, { recursive: true });
                // 
                
                console.log('Directory created successfully at', folderPath);
            } else {
                throw err;
            }
        }
        // 


        const folderType = Standard ? 'standard' : 'simplified';
        const unsignedfolderPath = `${folderPath}/xmls/${folderType}/unsigned/`;
        const signedfolderPath = `${folderPath}/xmls/${folderType}/signed/`;
        // const unsignedfolderPath = `public/files/xmls/${folderType}/unsigned/`;
        // const signedfolderPath = `public/files/xmls/${folderType}/signed/`;

        const randomNo = await data?.body?.ardocumentno;

        const filePrefix = Standard ? 'standard' : 'simplified';
        const signedFileName = `${filePrefix}_signed_${randomNo}.xml`;
        const unsignedFileName = `${filePrefix}_unsigned_${randomNo}.xml`;

        // Combine the folder path and filename to create the full file path
        const filePath = unsignedfolderPath + unsignedFileName;

        fs.writeFile(filePath, templatedData, error => {
            if (error) {
                console.log('Faild to create xml file');
                return false;
            } else {
                return true;
            }
        });
        console.log('123123');

        let unsignedInvoicePath = unsignedfolderPath + unsignedFileName;
        let signedInvoicePath = signedfolderPath + signedFileName;
        // const signedQR = await signXML(unsignedInvoicePath, signedInvoicePath);
        if (unsignedInvoicePath && Standard) {
            console.log('return for Standard');
            return { success: true, unsignedPath: unsignedInvoicePath, randomNo };
        }
        if (unsignedInvoicePath && signedInvoicePath) {
            console.log('XML Generated ');
            console.log('Converting XML into JSON ');
            return { success: true, unsignedPath: unsignedInvoicePath, signedPath: signedInvoicePath, randomNo };
        } else {
            return { success: false, signedInvoice: false };
        }
    } catch (error) {
        throw new Error('Error from XML generation :' + ', ' + error.message);
        // return { success: false, signedInvoice: false };
    }
};

module.exports = {
    xmlGenerator,
};
