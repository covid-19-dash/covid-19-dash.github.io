Web.PredictData = function (country) {
    var covidDataSet = JSON.parse(JSON.stringify(Web.Data));

    for (var prop in covidDataSet) {
        if ((prop !== 'PerCountry') && (prop !== 'Learned') && (prop !== 'Selected')) {
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
        if ((prop !== 'PerCountry') && (prop !== 'Learned') && (prop !== 'Selected')) {
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
    }

    for (var i = 0; i <= daysFrom; i++) {
        outputs.push({
            confirmed: 0,
            deaths: 0,
            recovered: 0
        });
    }

    for (var prop in covidDataSet) {
        if ((prop !== 'PerCountry') && (prop !== 'Learned') && (prop !== 'Selected')) {
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

    var trainConfirmedData = [];
    var trainDeathsData = [];
    var trainRecoveredData = [];
    outputs.forEach(output => {
        trainConfirmedData.push(output.confirmed / countryLargestValues.confirmed);
        trainDeathsData.push(output.deaths / countryLargestValues.deaths);
        trainRecoveredData.push(output.recovered / countryLargestValues.recovered);
    });

    return {
        TrainConfirmedData: trainConfirmedData,
        TrainDeathsData: trainDeathsData,
        TrainRecoveredData: trainRecoveredData,
        CountryLargestValues: countryLargestValues
    };
};