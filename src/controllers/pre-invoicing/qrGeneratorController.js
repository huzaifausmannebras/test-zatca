const toDataURL = require('qrcode');

const generateQr = async (req, res) => {
    const { Seller, VatNumber, TimeStamp, InvoiceTotal, VatTotal } = req.body;

    if (
        !Seller ||
        !VatNumber ||
        !TimeStamp ||
        !InvoiceTotal ||
        isNaN(parseFloat(InvoiceTotal)) ||
        !VatTotal ||
        isNaN(parseFloat(VatTotal))
    ) {
        return res.status(400).json({
            error: 'All fields are required and must be valid (Seller,VatNumber,TimeStamp,InvoiceTotal,VatTotal)',
        });
    }

    let testObj = req.body;

    try {
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

        const resolved = await toQrCode(testObj);
        console.log('Final Response', resolved);
        res.status(200).send(resolved);
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = generateQr;

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

//     let testObj = req.body;

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

//         const resolved = await toQrCode(testObj);
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

// let testObj = req.body
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

//     //console.log(exports.toHex(testObj))
//     //console.log(exports.toBase64(testObj))
//     toQrCode(testObj).then((resolved) => {
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
