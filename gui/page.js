const inherit = require('core/utils').inherit;
const base = require('core/utils').base;
const G3WObject = require('core/g3wobject');

const Page = function(parentView,config){
  this.parentView = parentView;
  this.config = config;
  this.pageComponent = config.pageComponent;
  this.urls = config.server.urls;
  base(this);
  
  this.onShow = function(path,request) {
    this.parentView.on('pagemounted', () => {
      this.handleRequest(path,request);
    });
    return this.pageComponent;
  }
};

inherit(Page,G3WObject);

module.exports = Page;
