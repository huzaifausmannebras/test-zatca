const toDataURL = require('qrcode');
const OrganizationModel = require('../../models/miscellaneous/organization');
const QrModel = require('../../models/preInvoicing/qrModel_phase1');
const { extractValues } = require('../../utils/util-mapper');
const InvoiceQrTemplate = require('../../models/preInvoicing/findTemplate');

const generateQrPhase1 = async (req, res) => {
    let invoiceObj = req.body;

    const updated = await QrModel.findOneAndUpdate({ transactionNo: invoiceObj.ardocumentno }, { "isDeletedObject.status": true })
    if (updated) {
        console.log("updatedqwerty", updated, "updatedabcdefg")
        res.status(200).json({
            response: {
                data: updated.response.split(',')[1],
                transactionno: updated.obj.ardocumentno,
                transactionlayer: updated?.transactionLayer,
                processcode: updated.processCode,
                vatnumber: updated?.vatNumber,
                refrowuid: updated.obj.rowuid,
            },
            status: true,
            message: 'Qr base64 has generated and saved successfuly',
            warning: false,
        });
        return

    }

    /////////////////////////
    // to add company on DB uncommit this code
    // const company = new OrganizationModel({
    //     clientNo: 'FEX',
    //     cocode: '0101',
    //     organizationIdentifier: '344444999900094',
    //     name: 'Filter Expert',
    //     name: 'Filter Expert',
    //     countryName: 'KSA',
    //     location: 'KSA, Daharan, habibi tower  ,2353th Floor ',
    //     invoiceType: 1100,
    //     companyURL: 'https://fex.com/',
    //     region: 'east',
    //     industry: 'IT',
    //     location: [
    //         {
    //             uuid: '48c50f23-db46-4e05-bc07-07514d79acf5',
    //             retailstoreno: '010101',
    //             retailstorestxt: 'Filter Expert, Daharan',
    //             organizationIdentifier: '344444999900094',
    //             serialNumber: '1-EXG|2-0101|3-01-|4-07514d79acf5',
    //             countryName: 'KSA',
    //             region: 'Daharana',
    //             street: '21',
    //             city: 'Daharana',
    //             postal: '3300',
    //         },
    //     ],
    // });
    // const save = await company.save();
    // console.log('going to save');
    // if (save) {
    //     const allComp = await OrganizationModel.find({ cocode: '0101', 'location.retailstoreno': '010101' });
    //     console.log(allComp);
    //     console.log(allComp.length);
    //     return;
    //     console.log('abc');
    //     res.status(200).json({ message: 'organization fetched', response: allComp });
    //     return;
    // } else {
    //     console.log('faild to save');
    // }
    // return;
    ///////////////////////////////////
    // To add maps on DB uncommit this code

    // try {
    //     const datw = await InvoiceQrTemplate.create({
    //         templateno: '123123',
    //         processcode: 'ARCI',
    //         description: 'Customer Invoice Memo ',
    //         screenname: 'Customer Invoice Memo',
    //     });
    //     console.log('1');
    //     await datw.save().then(async () => {
    //         const savedObj = await InvoiceQrTemplate.findOne({
    //             templateno: '123123',
    //         });
    //         console.log('savedobj', 'savedobj');
    //         res.status(200).json({ message: 'mapp saved', savedObj });
    //     });
    //     return;
    // } catch (error) {
    //     console.log(error);
    //     res.status(400).json({ message: 'faild to save', error });
    // }
    // return;
    /////////////////////////////////
    ///////////////////////////////////
    // To Fetch maps from  DB uncommit this code
    // try {
    //     const datw = await InvoiceQrTemplate.find({});
    //     res.status(200).json({ message: 'fatchedsaved', datw });
    // } catch (error) {
    //     console.log(error);
    //     res.status(400).json({ message: 'faild to save', error });
    // }
    // return;
    /////////////////////////////////
    /////////////////////////

    let checkLocation = true; //Boolean

    // adding retailstoreno from organization if it's not available
    if (!invoiceObj?.retailstoreno || invoiceObj?.retailstoreno.length < 1) {
        console.log('retailstoreno is not in the header');
        checkLocation = false;
        try {
            const organization = await OrganizationModel.findOne({ cocode: invoiceObj?.cocode });
            if (organization) {
                invoiceObj.retailstoreno = organization.organizationIdentifier;
                console.log('retailstoreno added from organization:', invoiceObj.retailstoreno);
            } else {
                res.status(400).json({
                    data: {},
                    status: false,
                    message: 'Organization not found for this cocode',
                    warning: true,
                });
                console.log('Organization not found for cocode:', invoiceObj.cocode);
            }
        } catch (error) {
            console.error('Error occurred while fetching organization:', error);
        }
    } else {
        console.log('retailtoreno is taken from body header data ');
    }

    const values = await extractValues(invoiceObj);
    // console.log("these are values",values)
    if (!values.success) {
        res.status(400).json({
            data: {},
            status: values.success,
            message: values.errorMessage,
            warning: true,
        });
        return;
    }

    if (!invoiceObj.processcode) {
        res.status(400).json({
            data: {},
            status: false,
            message: 'processcode is required in body header',
            warning: true,
        });
        return

    } else if (!invoiceObj?.retailstoreno || invoiceObj?.retailstoreno.length < 1) {
        res.status(400).json({
            data: {},
            status: false,
            message:
                'retailstoreno is required in header currently we faild to take it from organization (organizationIdentifier)',
            warning: true,
        });
        return
    }
    try {
        // need to change accordingly if retailstore not avail
        const organizationData = await OrganizationModel.findOne(
            {
                cocode: invoiceObj.cocode,
                ...(checkLocation ? { 'location.retailstoreno': invoiceObj?.retailstoreno } : {}),
                //

                // 'location.retailstoreno': invoiceObj?.retailstoreno, //"01"
            },
            {
                cocode: 1,
                clientNo: 1,
                organizationIdentifier: 1,
                name: 1,
                location: { $elemMatch: { retailstoreno: invoiceObj?.retailstoreno } },
                // location: { $elemMatch: { retailstoreno: invoiceObj.ardocumentdtls[0].retailstoreno } },
            },
        );

        if (!organizationData) {
            res.status(400).json({
                data: {},
                status: false,
                message: 'No Organization available with this cocode or retailstoreno',
                warning: true,
            });

            return;
        }
        const vatNumber = organizationData?.location[0]?.organizationIdentifier;
        console.log('organizationData', organizationData);
        const sellerName = checkLocation ? organizationData.location[0]?.retailstorestxt : organizationData?.name;
        const data = {
            Seller: sellerName, //organizationData.location[0]?.retailstorestxt,
            VatNumber: vatNumber ? vatNumber : organizationData?.organizationIdentifier,
            TimeStamp: invoiceObj.dbtimestmp,
            InvoiceTotal: values.docamountincludingtax.toString(), // invoiceObj?.ardocumentdtls[0]?.taxdocumentamount?.toString(), // docamountincludingtax
            VatTotal: values.docamounttax.toString(), // invoiceObj?.ardocumentdtls[0]?.documentamountincludetax?.toString(), // taxdocamount
        };

        if (
            !data.Seller ||
            !data.VatNumber ||
            !data.TimeStamp ||
            !data.InvoiceTotal ||
            isNaN(parseFloat(data.InvoiceTotal)) ||
            !data.VatTotal ||
            isNaN(parseFloat(data.VatTotal))
        ) {
            res.status(400).json({
                status: false,
                response: { data: [] },
                message: 'All fields are required and must be valid (Seller,VatNumber,TimeStamp,InvoiceTotal,VatTotal)',
                warning: true,
            });
            return
        }

        function getTlvForValue(tagNum, tagValue) {
            const tagNumBuf = Buffer.from([tagNum], 'utf8');
            const tagValueLenBuf = Buffer.from([tagValue.length], 'utf8');
            const tagValueBuf = Buffer.from(tagValue, 'utf8');
            const arrBuff = [tagNumBuf, tagValueLenBuf, tagValueBuf];
            return Buffer.concat(arrBuff);
        }

        function setFinalBuf(obj) {
            const tagsBufs = [];
            Object.values(obj).forEach((value, index) => {
                tagsBufs.push(getTlvForValue(index + 1, value));
            });
            return Buffer.concat(tagsBufs);
        }

        function toBase64(obj) {
            if (!obj) return null;
            const finalBuf = setFinalBuf(obj);
            return finalBuf.toString('base64');
        }

        async function toQrCode(obj) {
            if (!obj) return null;
            const qr = await toDataURL.toDataURL(toBase64(obj));
            return qr;
        }

        const response = await toQrCode(data);
        console.log('Final Response', response);

        const qrsaved = await QrModel.create({
            response: response,
            obj: invoiceObj,
            transactionNo: invoiceObj?.ardocumentno,
            transactionLayer: invoiceObj?.transactionlayerno,
            processCode: invoiceObj.processcode,
            vatNumber: vatNumber ? vatNumber : organizationData?.organizationIdentifier,
            refNo: invoiceObj.rowuid,
            version: 2
        });

        if (qrsaved) {
            console.log("new doc")
            res.status(200).json({
                response: {
                    data: response.split(',')[1],
                    transactionno: invoiceObj.ardocumentno,
                    transactionlayer: invoiceObj.transactionlayerno,
                    processcode: invoiceObj.processcode,
                    vatnumber: vatNumber ? vatNumber : organizationData?.organizationIdentifier,
                    refrowuid: invoiceObj.rowuid,
                },
                status: true,
                message: 'Qr base64 has generated and saved successfuly',
                warning: false,
            });
            return
        } else {
            res.status(400).json({
                data: {
                    response: response,
                    transactionno: invoiceObj.ardocumentno,
                    transactionlayer: invoiceObj.transactionlayerno,
                    processcode: invoiceObj.processcode,
                    vatnumber: vatNumber ? vatNumber : organizationData?.organizationIdentifier,
                    refno: invoiceObj.rowuid,
                },
                status: false,
                message: 'Qr base64 has generated but faild to saved in database',
                warning: true,
            });
            return
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(404).json({
            response: {
                data: error,
            },
            status: false,
            message: 'Qr base64 faild to generate or save ',
            warning: true,
        });
        return
    }
};

module.exports = generateQrPhase1;

// ***********************************************************************************************//
///////////////////////////////////// This controller is for .JS //////////////////////////////////
// ***********************************************************************************************//

// const toDataURL = require('qrcode');
// const generateQr = async (req, res) => {
//     const { Seller, VatNumber, TimeStamp, InvoiceTotal, VatTotal } = req.body;

//     if (
//         !Seller ||
//         !VatNumber ||
//         !TimeStamp ||
//         !InvoiceTotal ||
//         isNaN(parseFloat(InvoiceTotal)) ||
//         !VatTotal ||
//         isNaN(parseFloat(VatTotal))
//     ) {
//         return res.status(400).json({
//             error: 'All fields are required and must be valid (Seller,VatNumber,TimeStamp,InvoiceTotal,VatTotal)',
//         });
//     }

//     let invoiceObj = req.body;

//     try {
//         function getTlvForValue(tagNum, tagValue) {
//             const tagNumBuf = Buffer.from([tagNum], 'utf8');
//             const tagValueLenBuf = Buffer.from([tagValue.length], 'utf8');
//             const tagValueBuf = Buffer.from(tagValue, 'utf8');

//             const arrBuff = [tagNumBuf, tagValueLenBuf, tagValueBuf];
//             return Buffer.concat(arrBuff);
//         }

//         function setFinalBuf(obj) {
//             const tagsBufs = [];
//             Object.values(obj).forEach((value, index) => {
//                 tagsBufs.push(getTlvForValue(index + 1, value));
//             });
//             return Buffer.concat(tagsBufs);
//         }

//         function toBase64(obj) {
//             if (!obj) return null;
//             const finalBuf = setFinalBuf(obj);
//             return finalBuf.toString('base64');
//         }

//         async function toQrCode(obj) {
//             if (!obj) return null;
//             const qr = await toDataURL.toDataURL(toBase64(obj));
//             return qr;
//         }

//         const resolved = await toQrCode(invoiceObj);
//         console.log('Final Response', resolved);
//         res.status(200).send(resolved);
//     } catch (error) {
//         console.error('Error generating QR code:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// module.exports = generateQr;

////////////////////////////////////////////// .JS Ends ////////////////////////////////////////////
// ***********************************************************************************************//

// ***********************************************************************************************//
///////////////////////////////////// This Controller is For .MJS //////////////////////////////////
// ***********************************************************************************************//

// import { Buffer } from "buffer";
// import { toDataURL } from "qrcode";

// const generateQr = async (req, res) => {
//   const { Seller, VatNumber, TimeStamp, InvoiceTotal, VatTotal } = req.body;

//   if (!Seller || !VatNumber || !TimeStamp || !InvoiceTotal || isNaN(parseFloat(InvoiceTotal)) || !VatTotal || isNaN(parseFloat(VatTotal))) {
//     return res.status(400).json({ error: "All fields are required and must be valid" });
//   }

// let invoiceObj = req.body
//   // Most Recent Faild Attemp Starts Here
//   try {
//     function getTlvForValue(tagNum, tagValue) {
//       const tagNumBuf = Buffer.from([tagNum], "utf8");
//       const tagValueLenBuf = Buffer.from([tagValue.length], "utf8");
//       const tagValueBuf = Buffer.from(tagValue, "utf8");

//       const arrBuff = [tagNumBuf, tagValueLenBuf, tagValueBuf];
//       return Buffer.concat(arrBuff);
//     }

//     // Concatenate and get final buffer
//     function setFinalBuf(obj) {
//       const tagsBufs = [];
//       Object.values(obj).forEach((value, index) => {
//         tagsBufs.push(getTlvForValue(index + 1, value));
//       });
//       return Buffer.concat(tagsBufs);
//     }

//     // Hex String
//     function toHex(obj) {
//       if (!obj) return null;
//       const finalBuf = setFinalBuf(obj);
//       return finalBuf.toString("hex");
//     }

//     // Base64 String
//     function toBase64(obj) {
//       if (!obj) return null;
//       const finalBuf = setFinalBuf(obj);
//       return finalBuf.toString("base64");
//     }

//     // QR code image as base64
//     async function toQrCode(obj) {
//       if (!obj) return null;
//       const qr = toDataURL(toBase64(obj));
//       return qr;
//     }

//     //console.log(exports.toHex(invoiceObj))
//     //console.log(exports.toBase64(invoiceObj))
//     toQrCode(invoiceObj).then((resolved) => {
//       console.log("Final Response", resolved);

//       res.status(200).send(resolved);
//     });
//   } catch (error) {
//     console.error("Error generating QR code:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// export { generateQr };

///////////////////////////////////// .MJS Ends //////////////////////////////////
// *****************************************************************************//
