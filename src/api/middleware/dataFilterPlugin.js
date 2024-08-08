const organizationFilterPlugin = (schema) => {
    const applyOrganizationFilter = function (next) {
        if (this.options && this.options.organization) {
            const modelName = this.model.modelName;
            console.log("iiid ", this.options.organization)
            // const filter = modelName === 'organization' ? { _id: this.options.organization } : { organization: this.options.organization };
            const filter = modelName === 'organization' ? { _id: this.options.organization } : { organization: this.options.organization };
            this.where(filter);
        }
        next();
    };

    // Apply the filter to all find queries
    schema.pre('find', applyOrganizationFilter);
    schema.pre('findOne', applyOrganizationFilter);
    schema.pre('countDocuments', applyOrganizationFilter);
    schema.pre('findOneAndUpdate', applyOrganizationFilter);
    schema.pre('updateMany', applyOrganizationFilter);
    schema.pre('updateOne', applyOrganizationFilter);
};

module.exports = { organizationFilterPlugin };
