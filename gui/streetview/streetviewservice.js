var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');
var StreetViewComponent = require('gui/streetview/vue/streetview');

function StreetViewService() {
  this._position = null;
  this.setters = {
    postRender: function(position) {
      //hook postrender
    }
  };

  this.getPosition = function() {
    return this._position;
  };

  this.showStreetView = function(position) {
    this._position = position;
    GUI.setContent({
      content: new StreetViewComponent({
        service: this
      }),
      title: 'StreetView'
    });
  };
  base(this);
}

inherit(StreetViewService, G3WObject);

module.exports = StreetViewService;
