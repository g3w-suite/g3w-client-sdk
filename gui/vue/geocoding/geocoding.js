const t = require('core/i18n/i18n.service').t;
const GeocodingService = require('./geocodingservice');

Vue.component("geocoder",{
  template: require("./geocoding.html"),
  props: ['type'],
  data: function(){
    return {
      query: "",
      placeholder: t("street_search")
    }
  },
  methods: {
    search: function(e) {
      e.preventDefault();
      this.service.search(this.query);
    }
  },
  mounted: function(){
    this.service = GeocodingService[this.type];
    this.service.on("results", () => {
      this.query = "";
    })
  }
});
