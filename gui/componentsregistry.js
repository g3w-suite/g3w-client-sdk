const G3WObject = require('core/g3wobject');
const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;

//class Componet Registry (singleton)
// store all components added
function ComponentsRegistry() {
  
  this.components = {};
  this.registerComponent = function(component) {
    const id = component.getId();
    if (!this.components[id]) {
      this.components[id] = component;
      this.emit('componentregistered', component);
    }
  };
  this.getComponent = function(id) {
    return this.components[id];
  };

  this.getComponents = function() {
    return this.components;
  };
  this.unregisterComponent = function(id) {
    const component = this._components[id];
    if (component) {
      if (_.isFunction(component.destroy)) {
        component.destroy();
      }
      this._components[id] = null;
    }
  };
  base(this);
}
inherit(ComponentsRegistry,G3WObject);

module.exports = new ComponentsRegistry;
