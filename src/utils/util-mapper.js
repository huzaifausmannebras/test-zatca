const InvoiceQrTemplate = require('../models/preInvoicing/findTemplate');

async function extractValues(data) {
    if (!data.processcode) {
        return { success: false, errorMessage: 'processcode key not found in JSON data' };
    }
    try {
        const templateobj = await InvoiceQrTemplate.findOne({
            processcode: data.processcode,
        });
        if (!templateobj) {
            console.log('template not saved against this processcode');
            return { success: false, errorMessage: 'template not saved against this processcode' };
        }
        const templateno = templateobj.templateno;
        let docamountincludingtax = null;
        let docamounttax = null;
        let retailstoreno = null;

        // Determine keyNames based on the template

        if (templateno === '80910') {
            docamountincludingtax = 'docamountincludingtax';
            docamounttax = 'taxdocamount';
        } else if (templateno === '118716') {
            docamountincludingtax = 'documentamountexclusivetax';
            docamounttax = 'taxdocumentamount';
        } else if (templateno === '123122') {
            docamountincludingtax = 'docamountincludingtax';
            docamounttax = 'taxdocamount';
        } else if (templateno === '123123') {
            docamountincludingtax = 'docamountincludingtax';
            docamounttax = 'taxdocamount';
        } else if (templateno === '011849') {
            docamountincludingtax = 'docamountincludingtax';
            docamounttax = 'taxdocamount';
        } else if (templateno === '111111') {
            //testing
            docamountincludingtax = 'docwithtax';
            docamounttax = 'onlytax';
        } else {
            // If processCode is neither 123 nor 321, return error
            return { success: false, errorMessage: 'Not any templateno match to this' };
        }

        // Check if the determined keyName exists in the data
        // if (data.hasOwnProperty(docamountincludingtax, docamounttax, retailstoreno)) {
        if (data.hasOwnProperty(docamountincludingtax, docamounttax)) {
            docamountincludingtax = data[docamountincludingtax];
            docamounttax = data[docamounttax];
            // retailstoreno = data[retailstoreno];
        } else {
            // If the determined keyName doesn't exist, return error
            return {
                success: false,
                errorMessage: `Keys required by screen (${templateobj.screenname}) are not available in JSON,  For the system to proceed with (${templateobj.screenname}), values are needed for the following key names: ${docamountincludingtax}, ${docamounttax} `,
            };
        }

        // Return the extracted value
        return { success: true, docamountincludingtax, docamounttax, retailstoreno };
    } catch (error) {
        console.log(error);
    }
}
module.exports = { extractValues };
