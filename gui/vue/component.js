const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const resolve = require('core/utils/utils').resolve;
const BaseComponent = require('gui/component');

// class component
const Component = function(options) {
  base(this, options);
};

inherit(Component, BaseComponent);

const proto = Component.prototype;

proto.mount = function(parent, append) {
  const d = $.Deferred();
  if (!this.internalComponent) {
    this.setInternalComponent();
  }
  if (append) {
    const iCinstance = this.internalComponent.$mount();
    $(parent).append(iCinstance.$el);
  }
  else {
    this.internalComponent.$mount(parent);
  }
  Vue.nextTick(() => {
    $(parent).localize();
    this.emit('ready');
    d.resolve(true);
  });
  return d.promise();
};

proto.unmount = function() {
  if (_.isNil(this.internalComponent)) {
    return resolve();
  }
  // destroy vue component
  this.internalComponent.$destroy(true);
  // remove dom element
  $(this.internalComponent.$el).remove();
  // set internal componet to null (for GC)
  this.internalComponent = null;
  // resolve
  return resolve();
};
proto.ismount = function() {
  return this.internalComponent && this.internalComponent.$el;
};

proto.layout = function(width,height) {
  if (this.internalComponent) {}
};

module.exports = Component;
