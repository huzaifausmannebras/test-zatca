'use strict';

const { spawn } = require('child_process');
const multer = require('multer');
const fs = require('fs');
const CertificateSigningRequestModel = require('../../models/certificateManagement/certificateSigningRequest');
// const { certificateSigningRequestModel } = require('../../models/certificateManagement/certificateSigningRequest');
const csrGenerator = async (req, res) => {
    const timestamp = Date.now();

    // return;
    try {
        ////////////////////////////////////GENERATING CONFIG.PROPERTIES FILE///////////////////////////////////
        // This function "createPropertiesFile" creates config.Properties , that we use to generate CSR & Private Key.
        // Note : The CSR will only be able to generate on behalf of this config.properties file.

        async function createPropertiesFile(data, filePath, fileName) {
            try {
                // Convert the JSON data to a string in .properties file format
                const propertiesContent = Object.entries(data)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('\n');

                // Write the content to the file
                fs.writeFile(filePath, propertiesContent, error => {
                    if (error) {
                        console.log('Faild to create Properties file');
                        return false;
                    } else {
                        return true;
                    }
                });

                console.log(`Properties file created successfully at ${filePath}`);
                return {
                    name: fileName,
                    path: filePath,
                };
            } catch (error) {
                console.error('Error occurred while creating properties file:', error);
                return false;
            }
        }

        const propertiesfileName = `config_${timestamp}.properties`;
        const propertiesOutPutPath = `./public/cert/generatedCSRConfig/${propertiesfileName}`;

        const configGenrated = await createPropertiesFile(req.body, propertiesOutPutPath, propertiesfileName);

        console.log('configGenrated', configGenrated);
        /////////////////////////////////// CONFIG.PROPERTIES GENERATION ENDS HERE///////////////////////////////////

        // ********* //

        /////////////////////////////////// CSR AND PIVATE KEY  GENERATION STARTS HERE ///////////////////////////////////
        // Generating this csr and pvt key on the behalf of config file that i created earlier , That's why using the same value of path "propertiesCSRPath"

        // const configPath = propertiesCSRPath;
        const command = 'fatoora';
        // const timestamp = Date.now();
        const CSRfileName = `generated_csr_${timestamp}.csr`;
        const pakfileName = `generated_pvt_key_${timestamp}.key`;
        const csrOutputPath = `./public/cert/generatedCSR/${CSRfileName}`;
        const pakOutputPath = `./public/cert/generatedCSR/${pakfileName}`;

        console.log(`Executing command: ${command}`);

        const childProcess = spawn(
            command,
            [`-sim -csr -csrConfig ${propertiesOutPutPath} -privateKey ${pakOutputPath} -generatedCsr ${csrOutputPath}`],
            {
                shell: true,
            },
        );
        childProcess.stdout.on('data', data => {
            console.log(`stdout: ${data}`);
        });

        childProcess.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });

        childProcess.on('error', error => {
            console.error(`Error: ${error.message}`);
        });

        childProcess.on('close', async code => {
            console.log(`Child process exited with code ${code}`);
            fs.readFileSync(pakOutputPath, 'utf8');
            const csrContent = fs.readFileSync(csrOutputPath, 'utf8');
            // console.log(csrContent); //CSR Generated Here
            const privateKeyContent = fs.readFileSync(pakOutputPath, 'utf8');

            // console.log('saving data');
            try {
                const saveCSROnDB = new CertificateSigningRequestModel({
                    csr: csrContent,
                    privatekey: privateKeyContent,
                    serialNumber: req.body['csr.serial.number'],
                    // csr: csrContent,
                    // key: privateKeyContent,
                    directory: {
                        CSRConfig: configGenrated,
                        CSR: {
                            name: CSRfileName,
                            path: csrOutputPath,
                        },
                        PAK: {
                            name: pakfileName,
                            path: pakOutputPath,
                        },
                    },
                });
                const isSaved = await saveCSROnDB.save();
                if (isSaved) {
                    console.log('CSR Generated & Saved On DB ');
                    res.status(200).json({ message: 'CSR Generated & Saved In JSON Format', data: isSaved });
                    return;
                }
            } catch (error) {
                res.status(400).send('Faild To Generate CSR or Data Saving');
                console.log('error message', error);
            }
        });

        // res.status(200).json({ message: 'CSR & Private Key Generated' });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = csrGenerator;
