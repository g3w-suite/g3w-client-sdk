var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');
var PhotoComponent = require('gui/photo/vue/photo');

function PhotoService(url) {
  this.state = {
    url: url
  };
  this.showFullPhoto = function() {
    GUI.pushContent({
      content: new PhotoComponent({
        service: this
      }),
      backonclose: true,
      closable: false
    });
  };
  base(this);
}

inherit(PhotoService, G3WObject);

module.exports = PhotoService;
