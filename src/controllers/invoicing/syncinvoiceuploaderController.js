const xlsx = require('xlsx');
const syncInvoiceModel = require('../../models/SyncInvoice/SyncInvoiceModel');

// Configure multer to handle file uploads
const SyncInvoiceUploaderController = async (req, res) => {
    try {
        console.log('JSON Data', req.body);

        const invoice = new syncInvoiceModel({
            data: req.body,
        });

        await invoice.save();

        console.log('Sync Invoice Data saved ');
        res.status(200).json({ message: 'Sync Invoice Data saved' });
    } catch (error) {
        console.error('Error in saving sync invoice data:', error);
        res.status(500).send({ message: 'Error in saving sync invoice data', error: error?.message });
    }
};
const getAllISyncInvoices = async (req, res) => {
    try {
        const length = await syncInvoiceModel.countDocuments({});
        const invoice = await syncInvoiceModel.find({});
        console.log(invoice);
        // await invoice.save();

        res.status(200).json({ message: 'Sync Invoices fetched', length: length, data: invoice });
    } catch (error) {
        console.error('Error in fetching sync invoices:', error);
        res.status(500).send({ message: 'Something went wrong', error: error?.message });
    }
};
module.exports = { SyncInvoiceUploaderController, getAllISyncInvoices };
