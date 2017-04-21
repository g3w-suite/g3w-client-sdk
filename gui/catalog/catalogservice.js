var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');
var ProjectsRegistry = require('core/project/projectsregistry');

function CatalogService() {
  var self = this;
  this.state = {
    prstate: ProjectsRegistry.state,
    highlightlayers: false,
    customlayers:[]
  };
  this.setters = {
  };

  this.addCustomLayer = function(evt, fileObj) {
    var self = this;
    var defaultStyle = {
      'Point': new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: 'rgba(255,255,0,0.5)'
          }),
          radius: 5,
          stroke: new ol.style.Stroke({
            color: '#ff0',
            width: 1
          })
        })
      }),
      'LineString': new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#f00',
          width: 3
        })
      }),
      'Polygon': new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(0,255,255,0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: '#0ff',
          width: 1
        })
      }),
      'MultiPoint': new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: 'rgba(255,0,255,0.5)'
          }),
          radius: 5,
          stroke: new ol.style.Stroke({
            color: '#f0f',
            width: 1
          })
        })
      }),
      'MultiLineString': new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#0f0',
          width: 3
        })
      }),
      'MultiPolygon': new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(0,0,255,0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: '#00f',
          width: 1
        })
      })
    };

    var styleFunction = function(feature, resolution) {
      var featureStyleFunction = feature.getStyleFunction();
      if (featureStyleFunction) {
        return featureStyleFunction.call(feature, resolution);
      } else {
        return defaultStyle[feature.getGeometry().getType()];
      }
    };
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.getMap();
    var features = new ol.format.GeoJSON().readFeatures(evt.target.result);
    var vectorSource = new ol.source.Vector({
      features: features
    });
    map.addLayer(new ol.layer.Vector({
      source: vectorSource,
      style: styleFunction,
      name:fileObj.name
    }));
    map.getView().fit(vectorSource.getExtent());
    self.state.customlayers.push(fileObj)
  };
  base(this);
}

inherit(CatalogService, G3WObject);

module.exports = CatalogService;
