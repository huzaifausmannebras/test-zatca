'use strict';

const { spawn } = require('child_process');
const multer = require('multer');
const fs = require('fs').promises;
const CertificateSigningRequestModel = require('../../models/certificateManagement/certificateSigningRequest');

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

async function generateCSR_Processing(
    command,
    propertiesOutPutPath,
    pakOutputPath,
    csrOutputPath,
    body,
    CSRfileName,
    pakfileName,
    csrConfig,
    propertiesfileName,
) {
    return new Promise((resolve, reject) => {
        console.log("Both output", csrOutputPath, pakOutputPath)
        const childProcess = spawn(
            command,
            [
                `-sim -csr -csrConfig ${propertiesOutPutPath} -generatedCsr ${csrOutputPath} -privateKey ${pakOutputPath}`,
            ],
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
            if (code !== 0) {
                return reject(new Error(`Child process exited with code ${code}`));
            } else {
                console.log('csr generation command exited with ', code);
                try {
                    console.log('both are generated');

                    // const csrExists = await fs
                    //     .access(csrOutputPath)
                    //     .then(() => true)
                    //     .catch(() => false);
                    // const privateKeyExists = await fs
                    //     .access(pakOutputPath)
                    //     .then(() => true)
                    //     .catch(() => false);

                    // if (!csrExists || !privateKeyExists) {
                    //     return reject(new Error('One or both output files are missing'));
                    // }

                    // console.log('Both files are generated');

                    const csrContent = await fs.readFile(csrOutputPath, 'utf8');

                    // const privateKeyContent = await fs.readFile(pakOutputPath, 'utf8');

                    console.log('csrConfig', csrConfig);
                    const saveCSROnDB = new CertificateSigningRequestModel({
                        csr: csrContent,
                        privatekey: 'not sending',
                        serialNumber: body['csr.serial.number'],
                        directory: {
                            CSRConfig: {
                                name: propertiesfileName,
                                path: propertiesOutPutPath,
                            },
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

                    console.log('Attempting to save CSR to DB...');
                    const isSaved = await saveCSROnDB.save();
                    console.log('DB save operation completed');

                    if (isSaved) {
                        console.log('CSR Generated & Saved On DB');
                        resolve(isSaved);
                    } else {
                        console.log('Failed to save CSR to DB');
                        reject(new Error('Failed to save CSR to DB'));
                    }
                } catch (error) {
                    console.log('Error occurred:', error);
                    reject(error); // Use reject to ensure promise is correctly handled
                }
            }
        });
    });
}

const csrGeneratorUtilFunc = async (body, org) => {
    try {

        const folderPath = `public/cert/${org?.organizationIdentifier}`;

        try {
            await fs.access(folderPath);
            console.log("Folder already exists");
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.mkdir(folderPath, { recursive: true });
                console.log('Directory created successfully at', folderPath);
            } else {
                throw err;
            }
        }


        ////////////////////////////////////GENERATING CONFIG.PROPERTIES FILE///////////////////////////////////
        const timestamp = Date.now();
        const propertiesfileName = `config_${org.organizationIdentifier}.properties`;
        const propertiesOutPutPath = `./public/cert/${org?.organizationIdentifier}/${propertiesfileName}`;
        /////////////////////////////////// CONFIG.PROPERTIES GENERATION ENDS HERE///////////////////////////////////


        /////////////////////////////////// CSR AND PIVATE KEY  GENERATION STARTS HERE //////////////////////////////
        const command = 'fatoora';
        const CSRfileName = `generated_csr_${timestamp}.csr`;
        const pakfileName = `generated_pvt_key_${timestamp}.key`;
        const csrOutputPath = `./public/cert/${org?.organizationIdentifier}/${CSRfileName}`;
        const pakOutputPath = `./public/cert/${org?.organizationIdentifier}/${pakfileName}`;

        console.log(`Executing command: ${command}`);

        const csrConfig = await createPropertiesFile(body, propertiesOutPutPath, propertiesfileName);


        const CSR_Processing = await generateCSR_Processing(
            command,
            propertiesOutPutPath,
            pakOutputPath,
            csrOutputPath,
            body,
            CSRfileName,
            pakfileName,
            csrOutputPath,
            pakOutputPath,
            csrConfig,
            propertiesfileName,
        );

        // if (CSR_Processing) {
        //     console.log("csr to is generated and saved ")
        // }
        console.log('CSR Done', CSR_Processing);

        return CSR_Processing;
        // res.status(200).json({ message: 'CSR & Private Key Generated' });
    } catch (error) {
        console.log("actual error : ", error)
        throw new Error('Faild to create csr :', error.message);
    }
};

module.exports = csrGeneratorUtilFunc;
