const inherit = require('core/utils/utils').inherit;
const G3WObject = require('core/g3wobject');

function VectorLayer(config) {
  config = config || {};
  this.geometrytype = config.geometrytype || null;
  this.type = config.type || null;
  this.crs = config.crs  || null;
  this.id = config.id || null;
  this.name = config.name || "";
  this._olLayer = null;
  this._makeOlLayer({
    style: config.style
  });
  this.getFeatures({
    url: config.url,
    mapProjection: config.mapProjection
  });
}

inherit(VectorLayer,G3WObject);

module.exports = VectorLayer;

const proto = VectorLayer.prototype;

proto.setProvider = function(provider) {
  this._provider = provider;
};

proto.getProvider = function() {
  return this._provider;
};

proto._makeOlLayer = function({style} = {}) {
  const _style = this._makeStyle(style);
  this._olLayer = new ol.layer.Vector({
    name: this.name,
    id: this.id,
    style: _style,
    source: new ol.source.Vector({})
  })
};

proto._makeStyle = function(styleConfig) {
  let style;
  const styles = {};
  if (styleConfig) {
    Object.entries(styleConfig).forEach(([type, config]) => {
      switch (type) {
        case 'point':
          if (config.icon) {
            styles.image = new ol.style.Icon({
              src: config.icon.url,
              imageSize: config.icon.width
            })
          }
          break;
        case 'line':
          styles.stroke = new ol.style.Stroke({
            color: config.color,
            width: config.width
          });
          break;
        case 'polygon':
          styles.fill = new ol.style.Fill({
            color: config.color
          });
          break
      }
    });
    style = new ol.style.Style(styles);
  }
  return style
};

proto.getFeatures = function(options) {
  this._provider.getFeatures(options)
    .then((features) => {
      this.addFeatures(features)
    })
    .catch((err) => {
      console.log(err)
    })
};

proto.addFeatures = function(features=[]) {
  this.getSource().addFeatures(features)
};

proto.addFeature = function(feature) {
  if (feature) {
    this.getSource().addFeature(feature)
  }
};

proto.getOLLayer = function() {
  return this._olLayer;
};

proto.setOLLayer = function(olLayer) {
  this._olLayer = olLayer;
};


proto.getSource = function(){
  return this._olLayer.getSource();
};

proto.setSource = function(source) {
  this._olLayer.setSource(source);
};

proto.setStyle = function(style) {
  this._olLayer.setStyle(style);
};

proto.getFeatureById = function(fid){
  if (fid) {
    return this._olLayer.getSource().getFeatureById(fid);
  }
};

proto.isVisible = function() {
  return this._olLayer.getVisible();
};

proto.setVisible = function(bool) {
  this._olLayer.setVisible(bool);
};

proto.clear = function(){
  this.getSource().clear();
};

proto.addToMap = function(map){
  map.addLayer(this._olLayer);
};


