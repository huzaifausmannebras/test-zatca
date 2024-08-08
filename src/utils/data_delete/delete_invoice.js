const syncInvoiceModel = require('../../models/SyncInvoice/SyncInvoiceModel');

const removeFromSync = async docno => {
    console.log('going to remove ,', docno);

    try {
        const invoiceDeleted = await syncInvoiceModel.findOneAndDelete({ 'data.ardocumentno': docno });
        console.log('invoiceDeleted', invoiceDeleted);
        if (invoiceDeleted) {
            console.log('Clearance invoice removed from sync collection, clearance success');
        } else {
            console.log('Faild To remove invoice from sync collection');
        }

        return;
    } catch (error) {
        console.log('error in removing invoice from sync collection', error);
    }
};

module.exports = removeFromSync;
