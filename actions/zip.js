'use strict';
const path = require('path');
const shell = require('shelljs');

const zip = (vorpal, args, filename) => {
  return new Promise((resolve) => {
    shell.exec(`cp ${args.file} ${path.basename(args.file)}`, { silent: true });
    vorpal.session.log('preparing for upload...');
    shell.exec(`zip -r ${filename}.zip ${path.basename(args.file)} node_modules`, { silent: true });
    resolve();
  });
};

module.exports = zip;
