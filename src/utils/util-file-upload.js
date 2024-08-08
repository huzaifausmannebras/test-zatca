'use strict';

// Requiring Path, fs, q configuration
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const q = require('q');

// console.log(__dirname,'askjdhiuw')
const uploadPath = path.join(__dirname, '../../public/uploads/');
fs.ensureDir(uploadPath);

var files = 0,
    upload = [];

const fileUpload = async req => {
   
    // console.log(unique, 'sdhsjkdh');

    var deferred = q.defer();

    if (req.busboy) {
        upload = [];
        var fileStatus = false,
            finished = false;

           


        req.busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            var unique = (Math.floor(Math.random() * 90000) + 10000).toString();
            const fstream = fs.createWriteStream(path.join(uploadPath, unique + filename.filename.replace(/[^a-zA-Z0-9. ]/g, '').replaceAll(" ","") ));
            fileStatus = true;
            ++files;

            // Pipe it trough
            file.pipe(fstream);

            upload.push({
                basePath: fstream.path,
                path: fstream.path.substring(fstream.path.indexOf('public')),
                name: filename,
                fieldName: fieldname,
                mimetype: mimetype,
            });

            req.busboy.on('field', (fieldName, value) => {
                console.log('checking paths datas')
                req.body[fieldName] = value;
            });

            fstream.on('finish', function () {
                if (--files === 0 && finished) {
                    deferred.resolve({
                        status: true,
                        upload: _.uniqBy(upload, 'basePath'),
                        message: 'Uploaded successfully.',
                    });
                }
            });
        });

        req.busboy.on('finish', function () {
            if (!fileStatus)
                deferred.resolve({
                    status: false,
                    message: 'No file attached in finish.',
                });

            finished = true;
        });

        req.pipe(req.busboy);
    } else
        deferred.resolve({
            status: false,
            message: 'No file attached.',
        });

    return deferred.promise;
};

// fileUpload()

module.exports = {
    _uploadFile: fileUpload,
};