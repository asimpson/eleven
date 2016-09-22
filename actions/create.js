'use strict';
const vorpal = require('vorpal')();
const aws = require('aws-sdk');
const path = require('path');
const globby = require('globby');
const upload = require('./upload');
const zip = require('./zip');

const lambda = new aws.Lambda({ region: 'us-east-1' });
const s3 = new aws.S3();

const prompts = [
  {
    type: 'input',
    name: 'bucket',
    message: 'What is the Bucket name? ',
  },
  {
    type: 'input',
    name: 'arn',
    message: 'What is the Role string for this function? ',
  },
];

const createLambda = (args, cb) => {
  const fileName = path.basename(args.file, '.js');
  const name = args.options.n || fileName;
  const params = {
    Code: {
      S3Bucket: args.bucket,
      S3Key: args.options.k,
    },
    FunctionName: name,
    Handler: `${name}.handler`,
    Role: args.arn,
    Runtime: 'nodejs4.3',
    Publish: true,
  };

  lambda.createFunction(params, (err) => {
    if (err) cb('not created: ', err);
    else cb('done');
  });
};

const process = (args, cb) => {
  const newArgs = args;
  const fileName = path.basename(args.file, '.js');
  newArgs.options.k = `${fileName}.zip`;
  zip(vorpal, newArgs, fileName)
  .then(() => upload(vorpal, newArgs.bucket, newArgs.options.k))
  .then(() => createLambda(newArgs, cb));
};

const create = (args, cb) => {
  if (!args.options.b) {
    vorpal.session.prompt(prompts)
    .then(x => process(Object.assign(args, x), cb));
  } else {
    process(args, cb);
  }
};

module.exports = function (vorpal) {
  vorpal
    .command('create [file]')
    .autocomplete(globby.sync('./**/*.js').filter(x => !/node_modules/.test(x)))
    .option('-b [bucket]', 'AWS S3 Bucket name where the lambda zip file is')
    .option('-n [name]', 'Override name')
    .description('Creates a new Lambda function.')
    .alias('new')
    .action(create)
    .cancel(() => {
      // clean up zip and dupe file
    });
};
