var Web = {
    Initialize: function () {
        Web.Data.PerCountry = [{
            Country: 'All',
            Confirmed: 0,
            Deaths: 0,
            Recovered: 0
        }];

        for (let country in Web.Data) {
            if (country !== 'PerCountry') {
                Web.Data.PerCountry[0].Confirmed += Web.Data[country][Web.Data[country].length - 1].confirmed;
                Web.Data.PerCountry[0].Deaths += Web.Data[country][Web.Data[country].length - 1].deaths;
                Web.Data.PerCountry[0].Recovered += Web.Data[country][Web.Data[country].length - 1].recovered;

                Web.Data.PerCountry.push({
                    Country: country,
                    Confirmed: Web.Data[country][Web.Data[country].length - 1].confirmed,
                    Deaths: Web.Data[country][Web.Data[country].length - 1].deaths,
                    Recovered: Web.Data[country][Web.Data[country].length - 1].recovered
                });
            }
        }

        Web.Data.PerCountry.sort((a, b) => ((a.Confirmed > b.Confirmed) ? -1 : 1));
        Web.Data.Selected = Web.Data.PerCountry[0];

        Web.VueApp = new Vue({
            el: '#wrapper',
            data: Web.Data,
            methods: {
                setCountry: function (country) {
                    Web.Data.Selected = country;

                    this.$nextTick(() => {
                    });
                }
            }
        });
    }
};