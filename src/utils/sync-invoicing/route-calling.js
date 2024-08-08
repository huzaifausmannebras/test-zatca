const { default: axios } = require('axios');

const zatca_syncing_route_calling = async () => {
    try {
        const response = await axios.post('https://api-zatca-uat.nebrascorp.com/api/zatca-syncing', {});
        console.log('Zatca previous invoicing API called successfully:', response.data?.data);
    } catch (error) {
        console.error('Error In calling Zatca sync invoicing API');
    }
};

module.exports = zatca_syncing_route_calling;
