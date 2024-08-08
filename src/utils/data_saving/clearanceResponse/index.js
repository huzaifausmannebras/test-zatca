const ClearanceResponse = require("../../../models/response/clearance");

const saveClearance = async (data) => {
    console.log("goijnd to save data ,")
    try {
        const clearanceRespone = new ClearanceResponse(data)
        const saved = await clearanceRespone.save()

        if (saved) console.log("Clearance response saved successfully")
        else console.log("Faild To save Clearance response")
        return
    } catch (error) {
        console.log("error in saving Clearance response util", error)

    }


}




module.exports = { saveClearance };
