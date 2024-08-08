const QrModel = require('../../models/preInvoicing/qrModel_phase1');
const ReportingResponse = require('../../models/response/reporting');
const ClearanceResponse = require('../../models/response/clearance');

const GetPreInvoices = async (req, res) => {

    try {
        const param = req?.params?.docno

        // need to change accordingly if retailstore not avail

        const preInvoices = await QrModel.find(
            param ? { transactionNo: param } : {},

        ).sort({ _id: -1 }).limit(500);

        // const reporting = await ReportingResponse.find(
        //     param ? { ardocumentno: param } : {},

        // ).sort({ _id: -1 }).limit(500);
        // const clearance = await ClearanceResponse.find(
        //     param ? { ardocumentno: param } : {},
        // ).sort({ _id: -1 }).limit(500);


        const reporting = param
            && await ReportingResponse.find({ ardocumentno: param })
                .sort({ _id: -1 })
                .limit(500)
            ;

        const clearance = param
            && await ClearanceResponse.find({ ardocumentno: param })
                .sort({ _id: -1 })
                .limit(500)
            ;

        var phase2Data = []
        clearance?.forEach((item, index) =>
            phase2Data.push(item)
        )
        reporting?.forEach((item, index) =>
            phase2Data.push(item)
        )

        res.status(200).json({
            status: true, response: {
                data: {
                    phase1: preInvoices,
                    phase2: phase2Data.length ? phase2Data : []
                    // phase2: [
                    //     (clearance && clearance.length) && [clearance],
                    //     (reporting && reporting.length) && reporting
                    // ]
                }
            }, message: "Phase 01 Invoices data fetched"
            , warning: false,
        })

        console.log("Phase 01 Qr code data fetched")
    } catch (error) {
        console.error('Error Fetching QR Data (Phase 01):', error);
        res.status(404).json({
            response: {
                data: {
                    phase1: {},
                    phase2: {}
                },
            },
            status: false,
            message: 'Faild To Fetch  QR Data (Phase 01) ',
            warning: true,
        });
    }
};

module.exports = GetPreInvoices;
