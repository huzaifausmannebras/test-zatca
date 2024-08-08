'use strict';

const { default: axios } = require('axios');
const ReportingResponse = require('../../models/response/reporting');

// const axios = require('axios');

const invoiceReporting = async (req, res) => {
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
            'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/reporting/single',
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
async function getReportings(req, res) {
    const param = req?.params?.docno

    try {
        const allReports = await ReportingResponse.find(
            param ? { ardocumentno: param } : {},
        ).sort({ _id: -1 }).limit(500);
        if (allReports !== null) {
            res.status(200).json({ status: true, message: 'All Reports fetched', response: { data: allReports }, warning: false });


            console.log('Reports fetched');
            // const result = await ReportingResponse.updateMany({}, { $set: { status: 'cleared' } });
            // if (result.ok) {
            //     console.log('Update successful');
            // } else {
            //     console.error('Update failed:', result);
            // }
        } else {

            res.status(401).json({ status: false, message: 'faild to fetched Reports.', response: { data: {} }, warning: true });
        }
    } catch (error) {
        console.error('Error while fetching Reports:', error);
        res.status(500).json({ error: 'Error while fetching Reports' });
    }
}


module.exports = { invoiceReporting, getReportings };
