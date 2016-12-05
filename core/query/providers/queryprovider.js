var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var resolve = require('core/utils/utils').resolve;
var QueryWFSProvider = require('./ogc/queryWFSProvider');
var QueryWMSProvider = require('./ogc/queryWFSProvider');
var QueryQGISWMSProvider = require('./qgis/queryQGISWMSProvider');
var QueryQGISWFSProvider = require('./qgis/queryQGISWFSProvider');

var Providers = {
  'QGIS': {
    'wms': QueryQGISWMSProvider,
    'wfs': QueryQGISWFSProvider
  },
  'OGC': {
    'wms':QueryWMSProvider,
    'wfs': QueryWFSProvider
  }
};

function QueryProvider(options) {
  var options = options || {};
  var serverType = options.serverType || 'QGIS';
  var ogcService = options.ogcService || 'wms';
  this._provider = new Providers[serverType][ogcService];
  this.doSearch = function() {
    return this._provider.doSearch(options);
  };
  base(this);
}
inherit(QueryProvider, G3WObject);

module.exports =  QueryProvider;

