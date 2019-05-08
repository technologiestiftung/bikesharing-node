const config = require('./config.js');

const helpers = require('./modules/helpers.js')(config);

const csv = helpers.loadCsv(config.dataPath);


