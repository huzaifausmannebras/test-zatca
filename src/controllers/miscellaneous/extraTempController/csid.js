const CSIDComplianceModel = require('../../../models/certificateManagement/csidCompliance');

const getCSIDCompliance = async (req, res) => {
    try {
        const allCSR = await CSIDComplianceModel.find({});

        if (allCSR) {
            console.log('CSID  Fetched');
            res.status(200).json({ message: ' Compliance CSID  fetched', response: allCSR });
            return allCSR;
        } else {
            res.status(400).json({ message: 'No Compliance CSID  available or added ' });
            return false;
        }
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Something went wrong');
        return;
    }
};

const getSpecificCSIDCompliance = async (req, res) => {
    const { id } = req.params;
    console.log('ID is here ', id);
    try {
        const specificCSID = await CSIDComplianceModel.findOne({ _id: id });

        if (specificCSID) {
            console.log('specific CSID Fetched');
            res.status(200).json({ message: ' Compliance Specific CSID  fetched', response: specificCSID });
            return specificCSID;
        } else {
            res.status(400).json({ message: 'No Specific CSID  available or added ' });
            return false;
        }
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Something went wrong');
        return;
    }
};

module.exports = { getCSIDCompliance, getSpecificCSIDCompliance };
