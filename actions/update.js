'use strict';
const vorpal = require('vorpal')();
const aws = require('aws-sdk');
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const globby = require('globby');

const lambda = new aws.Lambda({ region: 'us-east-1' });
const s3 = new aws.S3();

const prompts = [
  {
    type: 'input',
    name: 'bucket',
    message: 'What is the Bucket name? ',
  },
];

const upload = (bucket, file) => {
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

const updateLambda = (args, cb) => {
  const fileName = path.basename(args.file, '.js');
  const name = args.options.n || fileName;
  const params = {
    S3Bucket: args.bucket,
    S3Key: args.options.k,
    FunctionName: name,
    Publish: true,
  };

  lambda.updateFunctionCode(params, (err) => {
    if (err) cb('not created: ', err);
    else cb('done');
  });
};

const process = (args, cb) => {
  const newArgs = args;
  const fileName = path.basename(args.file, '.js');
  newArgs.options.k = `${fileName}.zip`;
  shell.exec(`cp ${args.file} ${path.basename(args.file)}`, { silent: true });
  vorpal.session.log('preparing for upload...');
  shell.exec(`zip -r ${fileName}.zip ${path.basename(args.file)} node_modules`, { silent: true });
  upload(newArgs.bucket, newArgs.options.k)
  .then(() => updateLambda(newArgs, cb));
};

const update = (args, cb) => {
  if (!args.options.b) {
    vorpal.session.prompt(prompts)
    .then(x => process(Object.assign(args, x), cb));
  } else {
    process(args, cb);
  }
};

module.exports = function (vorpal) {
  vorpal
    .command('update [file]')
    .autocomplete(globby.sync('./**/*.js').filter(x => !/node_modules/.test(x)))
    .option('-b [bucket]', 'AWS S3 Bucket name where the lambda zip file is')
    .option('-n [name]', 'Override name')
    .description('Updates a Lambda function.')
    .alias('edit')
    .action(update)
    .cancel(() => {
      // clean up zip and dupe file
    });
};
