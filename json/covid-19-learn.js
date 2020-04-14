var covid19_PullData = require('./covid-19-pulldata.js');
var covid19_Learn = require('./covid-19-learn-method.js');

covid19_PullData(function() {
    covid19_Learn('', true, 14);
    covid19_Learn('South Africa', false, 14);
});