var covid19Learn = function (country = '', ignoreSaves = false, amountOfDays = 14) {
    var request = require("request");
    //var url = 'https://pomber.github.io/covid19/timeseries.json';

    var brain = require('./../vendor/brainjs/brain-browser.js');
    var fs = require('fs');
    var moment = require('moment');

    console.log('Checking data...');

    var jsData = fs.readFileSync('./data.js', 'utf8');
    var covidDataSet = JSON.parse(jsData.split('Web.Data = ').join(''));
    for (var prop in covidDataSet) {
        var lastVals = {};
        covidDataSet[prop].forEach(dateItem => {
            dateItem.dateValue = new Date(dateItem.date);
            if (lastVals.confirmed) {
                if (dateItem.confirmed === null) dateItem.confirmed = lastVals.confirmed;
                if (dateItem.deaths === null) dateItem.deaths = lastVals.deaths;
                if (dateItem.recovered === null) dateItem.recovered = lastVals.recovered;
            }
        });
    }

    console.log('Constructing training set....');

    var outputs = [];
    var countryLargestValues = {
        confirmed: -1,
        deaths: -1,
        recovered: -1
    };
    var daysFrom = -1;

    // Get largest values
    for (var prop in covidDataSet) {
        var firstDate = moment(covidDataSet[prop][0].dateValue);

        covidDataSet[prop].forEach(dateItem => {
            var thisDate = moment(dateItem.dateValue);
            var dateFromFirst = thisDate.diff(firstDate, 'days');
            dateItem.daysFrom = dateFromFirst;

            if ((daysFrom === -1) || (dateItem.daysFrom > daysFrom)) {
                daysFrom = dateItem.daysFrom;
            }
        });
    }

    for (var i = 0; i <= daysFrom; i++) {
        outputs.push({
            confirmed: 0,
            deaths: 0,
            recovered: 0
        });
    }

    for (var prop in covidDataSet) {
        if ((prop === country) || (country === '')) {
            var lastItem = {};
            covidDataSet[prop].forEach(dateItem => {
                for (var i = dateItem.daysFrom; i < daysFrom; i++) {
                    outputs[i].confirmed += (dateItem.confirmed - ((lastItem.confirmed) ? lastItem.confirmed : 0));
                    outputs[i].deaths += (dateItem.deaths - ((lastItem.deaths) ? lastItem.deaths : 0));
                    outputs[i].recovered += (dateItem.recovered - ((lastItem.recovered) ? lastItem.recovered : 0));
                }

                lastItem = dateItem;
            });

            outputs[daysFrom].confirmed += lastItem.confirmed;
            outputs[daysFrom].deaths += lastItem.deaths;
            outputs[daysFrom].recovered += lastItem.recovered;
        }
    }

    countryLargestValues.confirmed = -1;
    countryLargestValues.deaths = -1;
    countryLargestValues.recovered = -1;
    outputs.forEach(output => {
        if ((countryLargestValues.confirmed === -1) || (output.confirmed > countryLargestValues.confirmed)) {
            countryLargestValues.confirmed = output.confirmed;
        }
        if ((countryLargestValues.deaths === -1) || (output.deaths > countryLargestValues.deaths)) {
            countryLargestValues.deaths = output.deaths;
        }
        if ((countryLargestValues.recovered === -1) || (output.recovered > countryLargestValues.recovered)) {
            countryLargestValues.recovered = output.recovered;
        }
    });

    let trainConfirmedData = [];
    let trainDeathsData = [];
    let trainRecoveredData = [];
    outputs.forEach(output => {
        trainConfirmedData.push(output.confirmed / countryLargestValues.confirmed);
        trainDeathsData.push(output.deaths / countryLargestValues.deaths);
        trainRecoveredData.push(output.recovered / countryLargestValues.recovered);
    });

    var neuralOpts = {
        inputSize: 1,
        hiddenLayers: [10],
        outputSize: 1,
        learningRate: 0.01
    };
    var trainingOpts = {
        log: true,
        iterations: 300,
        errorThresh: 0.005
    };

    const netConfirmed = new brain.recurrent.LSTMTimeStep(neuralOpts);
    const netDeaths = new brain.recurrent.LSTMTimeStep(neuralOpts);
    const netRecovered = new brain.recurrent.LSTMTimeStep(neuralOpts);

    if ((fs.existsSync('./covid-19-confirmed.js')) && (!ignoreSaves)) {
        console.log('Loading confirmed training object....');
        var fileData = fs.readFileSync('./covid-19-confirmed.js', 'utf8').split('Web.VueData.Learned.Confirmed = ').join('');
        netConfirmed.fromJSON(JSON.parse(fileData));
        console.log('Confirmed Training Loaded.');
    } else {
        console.log('Training confirmed data start ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'));
        netConfirmed.train([trainConfirmedData], trainingOpts);
        console.log('Training confirmed data finished ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'));
        var jsonObj = JSON.stringify(netConfirmed.toJSON());
        fs.writeFileSync('./covid-19-confirmed.js', 'Web.VueData.Learned.Confirmed = ' + jsonObj, 'utf8');
    }

    if ((fs.existsSync('./covid-19-deaths.js')) && (!ignoreSaves)) {
        console.log('Loading deaths training object....');
        var fileData = fs.readFileSync('./covid-19-deaths.js', 'utf8').split('Web.VueData.Learned.Deaths = ').join('');
        netDeaths.fromJSON(JSON.parse(fileData));
        console.log('Deaths Training Loaded.');
    } else {
        console.log('Training deaths data start ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'));
        netDeaths.train([trainDeathsData], trainingOpts);
        console.log('Training deaths data finished ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'));
        var jsonObj = JSON.stringify(netDeaths.toJSON());
        fs.writeFileSync('./covid-19-deaths.js', 'Web.VueData.Learned.Deaths = ' + jsonObj, 'utf8');
    }

    if ((fs.existsSync('./covid-19-recovered.js')) && (!ignoreSaves)) {
        console.log('Loading recovered training object....');
        var fileData = fs.readFileSync('./covid-19-recovered.js', 'utf8').split('Web.VueData.Learned.Recovered = ').join('');
        netRecovered.fromJSON(JSON.parse(fileData));
        console.log('Recovered Training Loaded.');
    } else {
        console.log('Training recovered data start ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'));
        netRecovered.train([trainRecoveredData], trainingOpts);
        console.log('Training recovered data finished ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'));
        var jsonObj = JSON.stringify(netRecovered.toJSON());
        fs.writeFileSync('./covid-19-recovered.js', 'Web.VueData.Learned.Recovered = ' + jsonObj, 'utf8');
    }

    var forecastConfirmed = netConfirmed.forecast(trainConfirmedData, amountOfDays);
    var forecastDeaths = netDeaths.forecast(trainDeathsData, amountOfDays);
    var forecastRecovered = netRecovered.forecast(trainRecoveredData, amountOfDays);

    console.log(`Forecast for ${((country === '') ? 'the World' : country)} for next ${amountOfDays} days`);
    console.log(`Forecast Confirmed Cases (Last Value: ${countryLargestValues.confirmed}):`);
    forecastConfirmed.forEach((item, index) => {
        console.log(`In Next ${(index + 1)} ${((index === 0) ? 'day' : 'days')}: ${(item * countryLargestValues.confirmed)}`);
    });
    console.log(`Forecast Deaths Cases (Last Value: ${countryLargestValues.deaths}):`);
    forecastDeaths.forEach((item, index) => {
        console.log(`In Next ${(index + 1)} ${((index === 0) ? 'day' : 'days')}: ${(item * countryLargestValues.deaths)}`);
    });
    console.log(`Forecast Recovered Cases (Last Value: ${countryLargestValues.recovered}):`);
    forecastRecovered.forEach((item, index) => {
        console.log(`In Next ${(index + 1)} ${((index === 0) ? 'day' : 'days')}: ${(item * countryLargestValues.recovered)}`);
    });
    /*forecast.forEach(arr => {
        console.log(Math.trunc(arr[2]));
    });*/
};

module.exports = covid19Learn;