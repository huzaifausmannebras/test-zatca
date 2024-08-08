'use strict';

const UserModel = require('../../models/authentication/user');
const jwt = require('jsonwebtoken');
const OrganizationModel = require('../../models/miscellaneous/organization');


const Register = async (req, res) => {
    try {
        const { headers, body } = req;
        if (!body) {
            return res.status(400).json({ error: 'body is missing' });
        }
        const saveUser = await UserModel.create(body)


        res.status(200).json({ message: "user created success", data: saveUser });

    } catch (error) {
        console.error('Error making register request:', error);
        res.status(500).json({
            message: ` ${error.message}`,
            error: error,
        });

    };
};

const Login = async (req, res) => {
    try {
        const { headers, body } = req;
        if (!body) {
            return res.status(400).json({ error: 'body is missing' });
        }
        const { name, password, cocode } = body

        const user = await UserModel.findOne({ name, password })
        if (!user) {
            res.status(401).json({ message: "No user found, invalid credentials " })
            return
        }
        const organization = await OrganizationModel.findOne({
            _id: { $in: user.organization }, cocode: cocode
        })
        if (!organization) {
            res.status(401).json({ message: "No organization found, invalid credentials " })
            return
        }
        else {
            console.log("organization", organization)
        }
        // if(user.)
        // console.log(user.organization)



        const token = jwt.sign({ organizationid: organization._id, userid: user._id }, process.env.secretkey, {
            expiresIn: "8h",
        });

        res
            .cookie("token", token, {
                secure: true,
                httpOnly: true,
                sameSite: "None",
            })
            .json({ message: "Login successful.", user, token });
        console.log("Login successful:", user.name);




    } catch (error) {
        console.error('Error making login request:', error);
        res.status(500).json({ error: 'Error in login request', errorData: error });
    }
};
const Logout = async (req, res) => {
    try {
        res
            .cookie("token", "", {
                secure: true,
                httpOnly: true,
                sameSite: "None",
                expires: new Date(0)
            })
            .json({ message: "Logout successful." });

        console.log("Logout successful.");

    } catch (error) {
        console.error('Error making logout request:', error);
        res.status(500).json({ error: 'Error in logout request', errorData: error });
    }
};



// async function getClearance(req, res) {
//     try {
//         const allClearance = await ClearanceResponse.find(
//             {},
//             {
//                 success: 1,
//                 ardocumentno: 1,
//                 oldardocumentno: 1,
//                 transactionlayerno: 1,
//                 createdAt: 1,
//                 qr: 1,
//                 response: 1,
//                 createdAt: 1,
//                 'invoiceObject.typecode': 1,
//                 'invoiceObject.oldardocumentno': 1,
//                 'invoiceObject.postdate': 1,
//                 'invoiceObject.referenceno': 1,
//                 'invoiceObject.retailstoreno': 1,
//                 'invoiceObject.customername': 1,
//                 'invoiceObject.registrationno': 1,
//                 'invoiceObject.address': 1,
//                 'invoiceObject.creuser': 1,
//                 'invoiceObject.currencyno': 1,
//                 'invoiceObject.paymentmethodno': 1,
//                 'invoiceObject.grossdocamount': 1,
//                 'invoiceObject.discountdocamount': 1,
//                 'invoiceObject.netdocamount': 1,
//                 'invoiceObject.taxdocamount': 1,
//                 'invoiceObject.docamountincludingtax': 1,
//             },
//         ).sort({ _id: -1 });
//         // .limit(500);
//         if (allClearance !== null) {
//             res.status(200).json({ message: 'All Clearance fetched', data: allClearance });
//             console.log('Clearance fetched');
//         } else {
//             res.status(401).json({ error: 'faild to fetched Clearance.' });
//         }
//     } catch (error) {
//         console.error('Error while fetching Clearance:', error);
//         res.status(500).json({ error: 'Error while fetching Clearance' });
//     }
// }

module.exports = { Login, Register, Logout };
