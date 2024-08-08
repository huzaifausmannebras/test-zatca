'use strict';

const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
const UsersModel = require('../../models/authentication/user');
const OrganizationModel = require('../../models/miscellaneous/organization');


const authMiddlewear = async (req, res, next) => {
    try {
        
        const { token } = req.cookies;
        
        if (!token) {
            res.status(401).json({ success: false, message: "Login First, Faild to get auth token" });
            return;
        }
        const decoded =  jwt.verify(token, process.env.secretKey);
        console.log("decoded", decoded)
        const user = await UsersModel.findOne({ _id: decoded.userid })
        const organization = await OrganizationModel.findOne({ _id: decoded.organizationid })
        
        req.auth = { organization: organization, user: user }
        
        console.log("req.auth is here ", req.auth)
        
        if (!decoded) {
            throw new Error("faild to decode token")
        }
        console.log("middlewear runs")
        
        await next()
        // req.user = await UserModel.findById(decoded._id);


    } catch (error) {
        console.log("error inn authentication middlewar", error)
        res.status(401).json({ message: 'Authorizaion Faild or Expired please login ', error: error.message })
    }



};

module.exports = { authMiddlewear };
