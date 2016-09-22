#! /usr/bin/env node

'use strict';
const vorpal = require('vorpal')();
const create = require('./actions/create');
const update = require('./actions/update');

vorpal
.use(create)
.use(update);

vorpal
.delimiter('λ')
.show();
