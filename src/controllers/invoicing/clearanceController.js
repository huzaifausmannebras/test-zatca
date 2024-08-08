'use strict';

const axios = require('axios');
const ClearanceResponse = require('../../models/response/clearance');

const invoiceClearance = async (req, res) => {
    try {
        const { headers, body } = req;
        if (!headers['accept-version'] || !headers['clearance-status'] || !headers['accept-language']) {
            return res.status(400).json({
                error: 'Accept-Version , clearance-status in headers is required',
            });
        }
        if (!body) {
            return res.status(400).json({ error: 'compliance_request_id in body is missing' });
        }

        const postData = body;

        const response = await axios.post(
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/clearance/single',
            postData, // Directly pass postData here
            {
                headers: {
                    Authorization: headers.authorization,
                    'Accept-Version': headers['accept-version'],
                    'Clearance-Status': headers['clearance-status'],
                    'accept-language': headers['accept-language'],
                },
            },
        );

        res.status(200).json({ data: response.data });
    } catch (error) {
        console.error('Error making POST request:', error);
        res.status(500).json({ error: 'Internal Server Error', errorData: error });
    }
};

async function getClearance(req, res) {

    const param = req?.params?.docno
    try {
        const allClearance = await ClearanceResponse.find(
            param ? { ardocumentno: param } : {},
            {
                success: 1,
                ardocumentno: 1,
                oldardocumentno: 1,
                transactionlayerno: 1,
                createdAt: 1,
                qr: 1,
                response: 1,
                createdAt: 1,
                'invoiceObject.typecode': 1,
                'invoiceObject.oldardocumentno': 1,
                'invoiceObject.postdate': 1,
                'invoiceObject.referenceno': 1,
                'invoiceObject.retailstoreno': 1,
                'invoiceObject.customername': 1,
                'invoiceObject.registrationno': 1,
                'invoiceObject.address': 1,
                'invoiceObject.creuser': 1,
                'invoiceObject.currencyno': 1,
                'invoiceObject.paymentmethodno': 1,
                'invoiceObject.grossdocamount': 1,
                'invoiceObject.discountdocamount': 1,
                'invoiceObject.netdocamount': 1,
                'invoiceObject.taxdocamount': 1,
                'invoiceObject.docamountincludingtax': 1,
            },
        ).sort({ _id: -1 });
        // .limit(500);
        if (allClearance !== null) {
            res.status(200).json({ status: true, message: 'All Clearance fetched', response: { data: allClearance }, warning: false });
            console.log('Clearance fetched');
        } else {
            res.status(401).json({ error: 'faild to fetched Clearance.' });
        }
    } catch (error) {
        console.error('Error while fetching Clearance:', error);
        res.status(500).json({ error: 'Error while fetching Clearance' });
    }
}

module.exports = { invoiceClearance, getClearance };
