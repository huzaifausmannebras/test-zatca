const CertificateSigningRequestModel = require('../../../models/certificateManagement/certificateSigningRequest');

const getCSR = async (req, res) => {
    try {
        const allCSR = await CertificateSigningRequestModel.find({});

        if (allCSR) {
            console.log('CSR  Fetched');
            res.status(200).json({ message: 'csr fetched', response: allCSR });
            return allCSR;
        } else {
            res.status(400).json({ message: 'No CSR available or added ' });
            return false;
        }
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Something went wrong');
        return;
    }
};

module.exports = { getCSR };
