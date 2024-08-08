const xlsx = require('xlsx');
const multer = require('multer');
const InvoiceXmlModel = require('../../models/invoicing/InvoiceXmlModel');

// Configure multer to handle file uploads
const InvoiceXmlGenerator = (req, res) => {
    const upload = multer({ dest: 'public/excelSheet' });
    try {
        upload.single('file')(req, res, async error => {
            if (!error) {
                const filePath = req.file.path;
                const workBook = xlsx.readFile(filePath);
                const sheetName = workBook.SheetNames[0];
                const sheet = workBook.Sheets[sheetName];

                const jsonData = xlsx.utils.sheet_to_json(sheet);

                // Iterate over each row and save as a separate document
                jsonData.forEach(async row => {
                    const dataDictionary = row.dataDictionary.split(/\r?\n/).map(entry => {
                        const parts = entry.split(',').map(item => item.trim());
                        const obj = {};
                        parts.forEach(part => {
                            const [key, value] = part.split(':').map(item => item.trim());
                            obj[key] = value;
                        });
                        return obj;
                    });

                    const invoice = new InvoiceXmlModel({
                        idNo: row.idNo,
                        templateNo: row.templateNo,
                        description: row.description,
                        dataDictionary: dataDictionary,
                    });

                    await invoice.save();
                });
                console.log('Data saved in JSON Format');
                res.status(200).send('Data saved in JSON Format');
            } else {
                console.error('Failed to upload Excel:', error);
                res.status(400).send('Failed to upload Excel: ' + error.message);
            }
        });
    } catch (error) {
        console.error('Error converting Excel to JSON:', error);
        res.status(500).send('Something went wrong');
    }
};
const getAllInvoices = async (req, res) => {
    try {
        const invoice = await InvoiceXmlModel.find({});
        console.log(invoice);
        // await invoice.save();

        res.status(200).json({ message: 'Data fetched', data: invoice });
        console.error('Failed to upload Excel:', error);
        res.status(400).send('Failed to upload Excel: ' + error.message);
    } catch (error) {
        console.error('Error converting Excel to JSON:', error);
        res.status(500).send('Something went wrong');
    }
};
module.exports = { InvoiceXmlGenerator, getAllInvoices };
