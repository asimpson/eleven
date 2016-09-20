#! /usr/bin/env node

'use strict';
const vorpal = require('vorpal')();
const create = require('./actions/create');

vorpal
.use(create);

vorpal
.delimiter('λ')
.show();
