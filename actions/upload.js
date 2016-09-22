'use strict';
const fs = require('fs');
const aws = require('aws-sdk');

const s3 = new aws.S3();

const upload = (vorpal, bucket, file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        vorpal.session.log('fs error', err);
        reject();
      }
      const params = { Bucket: bucket, Body: data, Key: file };
      s3.upload(params, (uploadErr) => {
        if (uploadErr) {
          vorpal.session.log(uploadErr);
          reject();
        }
        vorpal.session.log('uploading...');
        resolve();
      });
    });
  });
};

module.exports = upload;
