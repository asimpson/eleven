'use strict';
const path = require('path');
const shell = require('shelljs');

const zip = (vorpal, args, filename) => {
  const file = args.file.length ? args.file[0] : args.file;
  return new Promise((resolve) => {
    let supportFiles = '';

    if (args.file.length) {
      supportFiles = args.file.filter((x, i) => i !== 0).reduce((p, c) => {
        return `${p} ${c}`;
      });
    }

    shell.exec(`cp ${file} ${path.basename(file)}`, { silent: true });
    vorpal.session.log('preparing for upload...');
    shell.exec(`zip -r ${filename}.zip ${path.basename(file)} ${supportFiles} node_modules`
        , { silent: true });
    resolve();
  });
};

module.exports = zip;
