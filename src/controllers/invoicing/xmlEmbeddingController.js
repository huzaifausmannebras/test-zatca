const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;

async function xmlEmbedding(req, res) {
    const { filename, typecode } = req.body;
const organization =  req.auth.organization
    console.log("request from") 

    try {
        let invoiceType;
        let filePrefix;
        if (typecode == '01') {
            invoiceType = 'standard';
            filePrefix = 'cleared_invoice_';
        } else if (typecode == '02') {
            invoiceType = 'simplified';
            filePrefix = 'simplified_signed_';
        } else {
            throw new Error('Typecode is missing  or wrong in body');       
        }

        if (!filename || !invoiceType) {
            res.status(404).json({
                message:
                    'valid filename (0123-123000000000123) and typecode (01 or 02) is mandatory to get invoice pdf',
                warning: false,
                error: true,
            });
            return;
        }
        const organizationFolder = `public/files/${organization.organizationIdentifier}`
        const attachementFile = `${organizationFolder}/xmls/${invoiceType}/signed/${filePrefix}${filename}.xml`;

        // checking the organization exist
        try {
            await fs.access(organizationFolder);
            console.log("xmls folder already exists");
        } catch (err) {
            if (err.code === 'ENOENT') {
            
                await fs.mkdir(folderPath, { recursive: true });
                // XML Folder and Inner 
                await fs.mkdir(`${organizationFolder}/xmls`, { recursive: true });

                await fs.mkdir(`${organizationFolder}/xmls/simplified`, { recursive: true });
                await fs.mkdir(`${organizationFolder}/xmls/simplified/generatedJSON`, { recursive: true });
                await fs.mkdir(`${organizationFolder}/xmls/simplified/signed`, { recursive: true });
                await fs.mkdir(`${organizationFolder}/xmls/simplified/unsigned`, { recursive: true });

                await fs.mkdir(`${organizationFolder}/xmls/standard`, { recursive: true });
                await fs.mkdir(`${organizationFolder}/xmls/standard/generatedJSON`, { recursive: true });
                await fs.mkdir(`${organizationFolder}/xmls/standard/unsigned`, { recursive: true });
                // 

                // PDF Folder and Inner 
                await fs.mkdir(`${organizationFolder}/pdf`, { recursive: true });

                await fs.mkdir(`${organizationFolder}/pdf/attached_pdf_invoices`, { recursive: true });
                await fs.mkdir(`${organizationFolder}/pdf/attached_pdf_invoices/simplified`, { recursive: true });
                await fs.mkdir(`${organizationFolder}/pdf/attached_pdf_invoices/standard`, { recursive: true });

            }
        }
        // checking the organization exist ends


        const AttachmentFileContent = await fs.readFile(attachementFile).catch(error => {
            console.log('attachment not available on path : ',attachementFile);
            throw new Error('Faild to get signed invoice xml from directory ');
        });
        console.log('AttachmentFileContent', AttachmentFileContent);

        const pdfDoc = await PDFDocument.create();
        await pdfDoc.attach(AttachmentFileContent, `${filename}.xml`, {
            mimeType: 'application/pdf',
            description: 'Nebras attachment description is here',
            creationDate: new Date(), // Add current date or specify as needed
            modificationDate: new Date(), // Add current date or specify as needed
        });

        // Add a page with some text (optional)
        const page = pdfDoc.addPage();
        page.drawText('This PDF has an attachment From Nebras', { x: 135, y: 415 });

        // here I'm Serializing the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();

        // And Finally here i am Writing the PDF to a file.
        const fileName = `${filePrefix}${filename}.pdf`;

        const myAttachedPdf = await fs.writeFile(
            `${organizationFolder}/pdf/attached_pdf_invoices/${invoiceType}/${fileName}`,
            Buffer.from(pdfBytes),
            error => {
                if (error) {
                    console.log('Faild to create signed & attached  PDF');
                    return false;
                } else {
                    return true;
                }
            },
        );

        console.log('PDF with attachment created successfully');

        res.status(200).download(`${organizationFolder}/pdf/attached_pdf_invoices/${invoiceType}/${fileName}`, fileName, err => {
            if (err) {
                console.error('Error sending PDF:', err);
                res.status(500).json({ error: 'Failed to send PDF' });
            } else {
                console.log('PDF sent successfully');
                res.status(200).json({
                    message: 'PDF with attachment created and sent successfully',
                    error: false,
                    warning: false,
                });
            }
        });
    } catch (error) {
        console.log('error in exml embedding into pdf file', error);
        res.status(400).json({ error: 'An error occurred while generating PDF' + error.message });

    }

}
module.exports = { xmlEmbedding };
