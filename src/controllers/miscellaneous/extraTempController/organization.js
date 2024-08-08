const OrganizationModel = require('../../../models/miscellaneous/organization');
const { findOneRestricted, findManyRestricted } = require('../../../utils/model_functions/get_data');

const getOrganization = async (req, res) => {
    try {


        console.log('organizatoin getting start');
        console.log('req.organization', req.organization);


        const organizationModelFind = await findManyRestricted(OrganizationModel, {}, req.organization)
        console.log(organizationModelFind);

        if (organizationModelFind) {
            console.log('Organizations  Fetched');
            res.status(200).json({ message: 'organizations fetched', response: organizationModelFind });
            return;
        } else {
            res.status(400).json({ message: 'No Organization available or added ' });
            return;
        }
    } catch (error) {
        console.error('Error :', error);
        res.status(500).json({ message: 'faild to fetch organization', error: error });
        return;
    }
};
const addOrganization = async (req, res) => {
    try {
        const organization = req.body;
        console.log('gonna add this companty', organization);
        const organizationModel = await OrganizationModel.create(organization);
        const saved = await organizationModel.save();

        if (saved) {
            console.log('Organizations  saved');
            res.status(200).json({ message: 'organizations added', response: organizationModel });
            return;
        } else {
            res.status(400).json({ message: 'faild to add organization' });
            return false;
        }
    } catch (error) {
        console.error('Error :', error);
        res.status(500).json({ message: 'faild to add', error: error });
        return;
    }
};

module.exports = { getOrganization, addOrganization };
