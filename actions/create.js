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
    name: 'arn',
    message: 'What is the Role string for this function? ',
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
      s3.upload(params, (err, data) => {
        if (err) {
          vorpal.session.log(err);
          reject();
        }
        vorpal.session.log('uploading...');
        resolve();
      });
    });
  });
};

const createLambda = (args, cb) => {
  const fileName = path.basename(args.file, '.js');
  const name = args.options.n ? args.options.n : fileName;
  const params = {
    Code: {
      S3Bucket: args.options.b,
      S3Key: args.options.k,
    },
    FunctionName: name,
    Handler: `${name}.handler`,
    Role: args.arn || args.options.r,
    Runtime: 'nodejs4.3',
    Publish: true,
  };

  lambda.createFunction(params, (err) => {
    if (err) cb('not created: ', err);
    else cb('done');
  });
};

const create = (args, cb) => {
  vorpal.session.prompt(prompts)
  .then(x => {
    Object.assign(args, x);
    if (!args.options.k) {
      shell.exec(`cp ${args.file} ${path.basename(args.file)}`, { silent: true });
      vorpal.session.log('preparing for upload...');
      shell.exec(`zip -r ${path.basename(args.file, '.js')}.zip ${path.basename(args.file)} node_modules`, { silent: true });
      args.options.k = `${path.basename(args.file, '.js')}.zip`;
      upload(args.options.b, args.options.k)
      .then(() => createLambda(args, cb));
    } else {
      createLambda(args, cb);
    }
  });
};

module.exports = function (vorpal) {
  vorpal
    .command('create [file]')
    .autocomplete(globby.sync('./**/*.js').filter(x => !/node_modules/.test(x)))
    .option('-b <bucket>', 'AWS S3 Bucket name where the lambda zip file is')
    .option('-k [key]', 'AWS S3 Bucket key (filename) of the zip file. Eleven will use this as the key if the zip file doesn\'t exist.')
    .option('-n [name]', 'Override name')
    .description('Creates a new Lambda function.')
    .alias('new')
    .action(create)
    .cancel(() => {
      //clean up zip and dupe file
    });
}
