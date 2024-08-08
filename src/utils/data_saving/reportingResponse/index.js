const ReportingResponse = require("../../../models/response/reporting");

const saveReporting = async (data) => {
    console.log("goijnd to save data ,")
    try {
        const reportingRespone = new ReportingResponse(data)
        const saved = await reportingRespone.save()

        if (saved) console.log("Reporting response saved successfully")
        else console.log("Faild To save Reporting response")
        return
    } catch (error) {
        console.log("error in saving reporting response util", error)

    }


}




module.exports = { saveReporting };
