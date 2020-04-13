var covid19_PullData = function (done) {
    const fs = require('fs');
    const request = require("request");

    const confirmedUrl = 'https://data.humdata.org/hxlproxy/api/data-preview.csv?url=https%3A%2F%2Fraw.githubusercontent.com%2FCSSEGISandData%2FCOVID-19%2Fmaster%2Fcsse_covid_19_data%2Fcsse_covid_19_time_series%2Ftime_series_covid19_confirmed_global.csv&filename=time_series_covid19_confirmed_global.csv';
    const deathsUrl = 'https://data.humdata.org/hxlproxy/api/data-preview.csv?url=https%3A%2F%2Fraw.githubusercontent.com%2FCSSEGISandData%2FCOVID-19%2Fmaster%2Fcsse_covid_19_data%2Fcsse_covid_19_time_series%2Ftime_series_covid19_deaths_global.csv&filename=time_series_covid19_deaths_global.csv';
    const recoveredUrl = 'https://data.humdata.org/hxlproxy/api/data-preview.csv?url=https%3A%2F%2Fraw.githubusercontent.com%2FCSSEGISandData%2FCOVID-19%2Fmaster%2Fcsse_covid_19_data%2Fcsse_covid_19_time_series%2Ftime_series_covid19_recovered_global.csv&filename=time_series_covid19_recovered_global.csv';

    var data = {};
    var dataConfirmed = {};
    var dataDeaths = {};
    var dataRecovered = {};
    var dates = [];

    request({
        url: confirmedUrl,
        json: true
    }, function (error, response, confirmedBody) {
        if (!error && response.statusCode === 200) {

            request({
                url: deathsUrl,
                json: true
            }, function (error, response, deathsBody) {
                if (!error && response.statusCode === 200) {

                    request({
                        url: recoveredUrl,
                        json: true
                    }, function (error, response, recoveryBody) {
                        if (!error && response.statusCode === 200) {

                            let confirmedLines = confirmedBody.split('\n');
                            let deathsLines = deathsBody.split('\n');
                            let recoveryLines = recoveryBody.split('\n');

                            confirmedLines.forEach((line, index) => {
                                let splitCols = line.split(',');

                                if (index === 0) {
                                    for (let i = 4; i < splitCols.length; i++) {
                                        dates.push(new Date(splitCols[i]));
                                    }
                                } else {
                                    if (typeof dataConfirmed[splitCols[1]] === 'undefined') {
                                        dataConfirmed[splitCols[1]] = [];
                                    }

                                    dates.forEach((date, index) => {
                                        if (typeof dataConfirmed[splitCols[1]][index] === 'undefined') {
                                            dataConfirmed[splitCols[1]].push({
                                                "date": `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`,
                                                "confirmed": parseFloat(splitCols[index + 4])
                                            });
                                        } else {
                                            dataConfirmed[splitCols[1]][index].confirmed += parseFloat(splitCols[index + 4]);
                                        }
                                    });
                                }
                            });

                            deathsLines.forEach((line, index) => {
                                let splitCols = line.split(',');

                                if (index !== 0) {
                                    if (typeof dataDeaths[splitCols[1]] === 'undefined') {
                                        dataDeaths[splitCols[1]] = [];
                                    }

                                    dates.forEach((date, index) => {
                                        if (typeof dataDeaths[splitCols[1]][index] === 'undefined') {
                                            dataDeaths[splitCols[1]].push({
                                                "date": `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`,
                                                "deaths": parseFloat(splitCols[index + 4])
                                            });
                                        } else {
                                            dataDeaths[splitCols[1]][index].deaths += parseFloat(splitCols[index + 4]);
                                        }
                                    });
                                }
                            });

                            recoveryLines.forEach((line, index) => {
                                let splitCols = line.split(',');

                                if (index !== 0) {
                                    if (typeof dataRecovered[splitCols[1]] === 'undefined') {
                                        dataRecovered[splitCols[1]] = [];
                                    }

                                    dates.forEach((date, index) => {
                                        if (typeof dataRecovered[splitCols[1]][index] === 'undefined') {
                                            dataRecovered[splitCols[1]].push({
                                                "date": `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`,
                                                "recovered": parseFloat(splitCols[index + 4])
                                            });
                                        } else {
                                            dataRecovered[splitCols[1]][index].recovered += parseFloat(splitCols[index + 4]);
                                        }
                                    });
                                }
                            });

                            for (let country in dataConfirmed) {
                                data[country] = [];

                                dates.forEach((date, index) => {
                                    var dateVal = `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`;
                                    var getItem = dataConfirmed[country].filter(i => i.date === dateVal);

                                    if (getItem.length > 0) {
                                        var dataItem = {
                                            date: dateVal,
                                            "confirmed": getItem[0].confirmed
                                        };

                                        if (typeof dataDeaths[country] !== 'undefined') {
                                            var getDeathsItem = dataDeaths[country].filter(i => i.date === dateVal);
                                            if (getDeathsItem.length > 0) {
                                                dataItem.deaths = getDeathsItem[0].deaths;
                                            } else {
                                                dataItem.deaths = 0;
                                            }
                                        } else {
                                            dataItem.deaths = 0;
                                        }

                                        if (typeof dataRecovered[country] !== 'undefined') {
                                            var getRecoveredItem = dataRecovered[country].filter(i => i.date === dateVal);
                                            if (getRecoveredItem.length > 0) {
                                                dataItem.recovered = getRecoveredItem[0].recovered;
                                            } else {
                                                dataItem.recovered = 0;
                                            }
                                        } else {
                                            dataItem.recovered = 0;
                                        }

                                        data[country].push(dataItem);
                                    }
                                });
                            }

                            delete data['undefined'];

                            fs.writeFileSync('./data.js', 'Web.Data = ' + JSON.stringify(data, null, 4), 'utf8');
                            done();
                        }
                    });
                }
            });
        }
    });
};

module.exports = covid19_PullData;