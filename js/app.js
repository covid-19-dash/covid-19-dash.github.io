var Web = {
    VueData: {
        SearchCountry: ''
    },

    Initialize: function () {
        Web.VueData.CountryData = Web.Data;

        Web.VueData.PerCountry = [{
            Country: 'All',
            Confirmed: 0,
            Deaths: 0,
            Recovered: 0
        }];

        for (let country in Web.Data) {
            if ((country !== 'PerCountry') && (country !== 'Learned') && (country !== 'Selected')) {
                Web.VueData.PerCountry[0].Confirmed += Web.Data[country][Web.Data[country].length - 1].confirmed;
                Web.VueData.PerCountry[0].Deaths += Web.Data[country][Web.Data[country].length - 1].deaths;
                Web.VueData.PerCountry[0].Recovered += Web.Data[country][Web.Data[country].length - 1].recovered;

                Web.VueData.PerCountry.push({
                    Country: country,
                    Confirmed: Web.Data[country][Web.Data[country].length - 1].confirmed,
                    Deaths: Web.Data[country][Web.Data[country].length - 1].deaths,
                    Recovered: Web.Data[country][Web.Data[country].length - 1].recovered
                });
            }
        }

        Web.VueData.PerCountry.sort((a, b) => ((a.Confirmed > b.Confirmed) ? -1 : 1));
        Web.VueData.Selected = Web.VueData.PerCountry[0];

        Web.VueApp = new Vue({
            el: '#wrapper',
            data: Web.VueData,
            methods: {
                setCountry: function (country) {
                    Web.VueData.Selected = country;

                    this.$nextTick(() => {
                        Web.DrawCharts();
                    });
                }
            },
            computed: {
                filteredCountries() {
                    var $this = this;
                    if ($this.SearchCountry === '')
                        return this.PerCountry;
                    else
                        return this.PerCountry.filter(country =>
                            country.Country.toUpperCase().indexOf($this.SearchCountry.toUpperCase()) !== -1);
                }
            }
        });

        Web.DrawCharts = function () {
            var amountOfDays = 14;

            var neuralOpts = {
                inputSize: 1,
                hiddenLayers: [10],
                outputSize: 1,
                learningRate: 0.01
            };

            const netConfirmed = new brain.recurrent.LSTMTimeStep(neuralOpts);
            const netDeaths = new brain.recurrent.LSTMTimeStep(neuralOpts);
            const netRecovered = new brain.recurrent.LSTMTimeStep(neuralOpts);

            netConfirmed.fromJSON(Web.VueData.Learned.Confirmed);
            netDeaths.fromJSON(Web.VueData.Learned.Deaths);
            netRecovered.fromJSON(Web.VueData.Learned.Recovered);

            var predictData = Web.PredictData(((Web.VueData.Selected.Country === 'All') ? '': Web.VueData.Selected.Country));

            Web.VueData.Learned.ForecastConfirmed = netConfirmed.forecast(predictData.TrainConfirmedData, amountOfDays);
            Web.VueData.Learned.ForecastDeaths = netDeaths.forecast(predictData.TrainDeathsData, amountOfDays);
            Web.VueData.Learned.ForecastRecovered = netRecovered.forecast(predictData.TrainRecoveredData, amountOfDays);

            var drawChart = function () {
                var dataArray = [['Date', 'Confirmed', 'Deaths', 'Recovered', 'Forecast Confirmed', 'Forecast Deaths', 'Forecast Recovered']];

                var processCountry = function (country) {
                    if ((country !== 'undefined') && (country !== 'Selected') && (country !== 'PerCountry') && (country !== 'Learned')) {
                        Web.Data[country].forEach(dateItem => {
                            var getExisting = dataArray.filter(i => i[0] === dateItem.date);

                            if (getExisting.length > 0) {
                                getExisting[0][1] += dateItem.confirmed;
                                getExisting[0][2] += dateItem.deaths;
                                getExisting[0][3] += dateItem.recovered;
                            } else {
                                dataArray.push([
                                    dateItem.date,
                                    dateItem.confirmed,
                                    dateItem.deaths,
                                    dateItem.recovered,
                                    0,0,0
                                ]);
                            }
                        });
                    }
                };

                if (Web.VueData.Selected.Country === 'All') {
                    for (var country in Web.Data) {
                        processCountry(country);
                    }
                } else {
                    processCountry(Web.VueData.Selected.Country);
                }

                var fromDate = new Date(dataArray[dataArray.length - 1][0]);
                Web.VueData.Learned.ForecastConfirmed.forEach((confirmed, index) => {
                    fromDate.setDate(fromDate.getDate() + (index + 1));

                    dataArray.push([
                        `${fromDate.getFullYear()}-${(fromDate.getMonth() + 1)}-${fromDate.getDate()}`,
                        0,0,0,
                        Math.ceil(confirmed * predictData.CountryLargestValues.confirmed),
                        Math.ceil(Web.VueData.Learned.ForecastDeaths[index] * predictData.CountryLargestValues.deaths),
                        Math.ceil(Web.VueData.Learned.ForecastRecovered[index] * predictData.CountryLargestValues.recovered)
                    ]);
                });
                
                var chartData = google.visualization.arrayToDataTable(dataArray);

                var options = {
                    hAxis: { title: 'Date', titleTextStyle: { color: '#333' } },
                    vAxis: { minValue: 0 },
                    explorer: { actions: ['dragToZoom', 'rightClickToReset'] }
                };

                var chart = new google.visualization.AreaChart(document.getElementById('confirmedChart'));
                chart.draw(chartData, options);
            };

            google.charts.load('current', { 'packages': ['corechart'] });
            google.charts.setOnLoadCallback(drawChart);
        };

        Web.DrawCharts();
    }
};