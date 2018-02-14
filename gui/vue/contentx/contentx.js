const t = require('core/i18n/i18n.service').t;
const GUI = require('gui/gui');
const RouterService = require('core/router');
const ol3helpers = require('g3w-ol3/src/g3w.ol3').helpers;

const ContentxViewComponent = Vue.component('g3w-contentx',{
  template: require('./contentx.html'),
});

function ContentxView() {
  let _viewComponent;
  this.getViewComponent = function(){
    if (!_viewComponent) {
      _viewComponent = new ContentxViewComponent;
    }
    return _viewComponent;
  };
  
  this.show = function(path){
    const view = RouterService.sliceFirst(path)[0];
    if (view == 'content') {
      const query = RouterService.getQueryParams(path);
    }
  };
  
  RouterService.onafter('setRoute',(path) => {
    this.show(path);
  });
}

module.exports = new ContentxView;
