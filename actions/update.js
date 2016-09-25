'use strict';
const vorpal = require('vorpal')();
const aws = require('aws-sdk');
const path = require('path');
const globby = require('globby');
const upload = require('./upload');
const zip = require('./zip');

const lambda = new aws.Lambda({ region: 'us-east-1' });

const prompts = [
  {
    type: 'input',
    name: 'bucket',
    message: 'What is the Bucket name? ',
  },
];

const updateLambda = (args, cb) => {
  const file = args.file[0];
  const fileName = path.basename(file, '.js');
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
  const file = args.file[0];
  const newArgs = args;
  const fileName = path.basename(file, '.js');
  newArgs.options.k = `${fileName}.zip`;
  zip(vorpal, newArgs, fileName)
  .then(() => upload(vorpal, newArgs.bucket, newArgs.options.k))
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
    .command('update [file...]')
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
