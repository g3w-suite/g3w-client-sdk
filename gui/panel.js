const inherit = require('core/utils/utils').inherit;
const resolvedValue = require('core/utils/utils').resolve;
const G3WObject = require('core/g3wobject');

const Panel = function(options={}) {
  console.log(options)
  this.internalPanel = null;
  this.id = options.id || null;
  this.title = options.title || '';
};

inherit(Panel, G3WObject);

const proto = Panel.prototype;

proto.getId = function(){
  return this.id;
};

proto.getTitle = function(){
  return this.title;
};

proto.getInternalPanel = function() {
  return this.internalPanel;
};

proto.setInternalPanel = function(internalPanel) {
  this.internalPanel = internalPanel;
};

proto.mount = function(parent) {
  const panel = this.internalPanel;
  const iCinstance = panel.$mount();
  $(parent).append(iCinstance.$el);
  iCinstance.$nextTick(function() {
    $(parent).localize();
    if (panel.onShow) {
      panel.onShow();
    }
  });
  return resolvedValue(true);
};


proto.unmount = function() {
  const panel = this.internalPanel;
  const d = $.Deferred();
  panel.$destroy(true);
  $(panel.$el).remove();
  if (panel.onClose) {
    panel.onClose();
  }
  this.internalComponent = null;
  d.resolve();
  return d.promise();
};

proto.onResize = function(parentWidth,parentHeight){};


module.exports = Panel;
