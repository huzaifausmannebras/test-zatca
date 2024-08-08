
const fs = require('fs');
const { spawn } = require('child_process');


async function generateInvoiceJSONUtilFunc(xmlPath, outputPath) {


    // console.log("xmlPath", xmlPath)
    // console.log("outputPath", outputPath)
    // return
    return new Promise((resolve, reject) => {
        const childProcessHash = spawn('fatoora', ['-invoiceRequest', '-invoice', xmlPath, `-apiRequest ${outputPath}`], {
            shell: true,
        });
        const JSONVObj = []; // Array to store QR code data

        childProcessHash.stdout.on('data', async data => {
            const hashVal = await data?.toString('utf8')?.trim();

            JSONVObj.push(hashVal); // Store each QR value in the array
            console.log("json loop log", hashVal)
        });

        childProcessHash.on('close', async code => {
            console.log("JSON generated", code);
            if (code === 0) {
                try {

                    // const jsonData = fs.readFileSync(outputPath, 'utf8');
                    // const parsedData = JSON.parse(jsonData);
                    // console.log("Invoice JSON is generated & parsed");
                    // resolve(parsedData);


                    fs.readFile(outputPath, 'utf8', async function (err, data) {
                        try {

                            console.log("outputPath of json", data)
                            const parsedData = JSON.parse(data);
                            resolve(parsedData);
                        } catch (error) {
                            console.log(error)
                        }
                    });


                } catch (err) {
                    console.error('Error reading or parsing JSON file:', err);
                    reject(err);
                }
            } else {
                reject(new Error(`Child process exited with code ${code}`));
            }
        });
    });
}



module.exports = generateInvoiceJSONUtilFunc