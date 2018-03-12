const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const ImageLayer = require('core/layers/imagelayer');

function BaseLayer(options){
  base(this,options);
  this.layer = null;
}

inherit(BaseLayer, ImageLayer);

const proto = BaseLayer.prototype;

proto._makeOlLayer = function() {
  //TO OVERWRITE
};

proto.getSource = function(){
  return this.getOLLayer().getSource();
};

proto.getLayerConfigs = function(){
  return this.layer;
};

proto.setLayer = function(layer){
  this.layer = layer;
};

proto.toggleLayer = function(){
  this._updateLayers();
};

proto.update = function(mapState, extraParams) {
  this._updateLayer(mapState, extraParams);
};

proto.getOLLayer = function(){
  let olLayer = this._olLayer;
  if (!olLayer) {
    olLayer = this._olLayer = this._makeOlLayer();
    if (this.layer.config.attributions) {
      this._olLayer.setAttributions(this.layer.config.attributions)
    }
  }
  return olLayer;
};

proto._updateLayer = function() {
  this.setVisible(this.layer.isVisible());
};

proto.setVisible = function(bool) {
  this._olLayer.setVisible(bool)
};


module.exports = BaseLayer;
