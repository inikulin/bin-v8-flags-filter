var path   = require('path');
var filter = require('../');

var gracefulShutdown = process.argv.indexOf('--graceful-shutdown') > -1;

filter(path.join(__dirname, './actual-cli.js'), { useShutdownMessage: gracefulShutdown });

