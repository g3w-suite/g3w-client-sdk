const noop = require('core/utils/utils').noop;
const inherit = require('core/utils/utils').inherit;
const G3WObject = require('core/g3wobject');
const RouterService = require('core/router');
const ComponentsRegistry = require('gui/componentsregistry');

// API della GUI.
// methods have be defined by application
// app shold call GUI.ready() when GUI is ready
function GUI() {
  this.isready = false;
  // images urls
  this.getResourcesUrl = noop;
  // show a Vue form
  this.showForm = noop;
  this.closeForm = noop;
  this.showListing = noop;
  this.closeListing = noop;
  this.hideListing = noop;
  this.showQueryResults = function(options) {};
  this.hideQueryResults = noop;
  this.showPanel = noop;
  this.hidePanel = noop;
  this.addComponent = function(component, placeholder) {};
  this.removeComponent = function(id) {};
  this.setComponent = function(component) {
    ComponentsRegistry.registerComponent(component);
  };
  this.getComponent = function(id) {
    return ComponentsRegistry.getComponent(id);
  };
  this.getComponents = function() {
    return ComponentsRegistry.getComponents();
  };
  this.goto = function(url) {
    RouterService.goto(url);
  };

  this.ready = function(){
    this.emit('ready');
    this.isready = true;
  };

  this.guiResized = function() {
    this.emit('guiresized');
  };

  /* spinner */
  this.showSpinner = function(options){};

  this.hideSpinner = function(id){};


  this.notify = noop;
  this.dialog = noop;
}

inherit(GUI,G3WObject);

module.exports = new GUI;
