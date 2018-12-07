const inherit = require('core/utils/utils').inherit;
const t = require('core/i18n/i18n.service').t;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');
const TableComponent = require('gui/table/vue/table');
const ComponentsRegistry = require('gui/componentsregistry');
const GUI = require('gui/gui');
const ControlsRegistry = require('gui/map/control/registry');
const CatalogLayersStoresRegistry = require('core/catalog/cataloglayersstoresregistry');
const Service = require('../catalogservice');
const ChromeComponent = VueColor.Chrome;
const CatalogEventHub = new Vue();

const vueComponentOptions = {
  template: require('./catalog.html'),
  data: function() {
    return {
      state: null,
      showlegend: false,
      copywmsurltooltip: t('sdk.catalog.menu.wms.copy'),
      // to show context menu right click
      layerMenu: {
        show: false,
        top:0,
        left:0,
        name: '',
        layer: null,
        loading: {
          data_table: false,
          shp: false
        },
        items: {
          zoomtolayer: t("catalog_items.contextmenu.zoomtolayer"),
          open_attribute_table: t("catalog_items.contextmenu.open_attribute_table"),
          showmetadata: t("catalog_items.contextmenu.show_metadata")
        },
        //colorMenu
        colorMenu: {
          show: false,
          top:0,
          left: 0,
          color: null
        }
      }
    }
  },
  directives: {
    //create a vue directive fro click outside contextmenu
    'click-outside-layer-menu': {
      bind: function (el, binding, vnode) {
        this.event = function (event) {
          if(!(el == event.target || el.contains(event.target))) {
            vnode.context[binding.expression](event);
          }
        };
        //add event listener click
        document.body.addEventListener('click', this.event)
      },
      unbind: function (el) {
        document.body.removeEventListener('click', this.event)
      }
    }
  },
  components: {
    'chrome-picker': ChromeComponent
  },
  computed: {
    project: function() {
      return this.state.prstate.currentProject
    },
    title: function() {
      return this.project.state.name;
    },
    baselayers: function() {
      return this.project.state.baselayers;
    },
    hasBaseLayers: function(){
      return this.project.state.baselayers.length>0;
    },
    hasLayers: function() {
      let layerstresslength = 0;
      _.forEach(this.state.layerstrees, function(layerstree) {
        layerstresslength+=layerstree.tree.length;
      });
      return this.state.externallayers.length > 0 || layerstresslength >0 || this.state.layersgroups.length > 0 ;
    },
    hasBaseLayersVisible: function() {
      let visible = false;
      this.baselayers.find((baselayer) => {
        if (baselayer.visible) {
          visible = true;
          return true;
        }
      });
      return visible;
    }
  },
  methods: {
    showLegend: function(bool) {
      this.showlegend = bool;
    },
    setBaseLayer: function(id) {
      this.project.setBaseLayer(id);
    },
    getSrcBaseLayerImage(baseLayerName) {
      let image;
      switch (baseLayerName) {
        case 'OpenStreetMap':
          image = 'osm.png';
          break;
        case 'Bing Streets':
          image = 'bingstreet.png';
          break;
        case 'Bing Aerial':
          image = 'bingaerial.png';
          break;
        case 'Bing Aerial With Labels':
          image = 'bingaeriallabel.png';
          break;
        default:
          image = 'nobaselayer.png';
      }
      return `${GUI.getResourcesUrl()}images/${image}`;
    },
    _hideMenu: function() {
      this.layerMenu.show = false;
    },
    zoomToLayer: function() {
      let bbox;
      if (this.layerMenu.layer.bbox) {
        bbox = [this.layerMenu.layer.bbox.minx, this.layerMenu.layer.bbox.miny, this.layerMenu.layer.bbox.maxx, this.layerMenu.layer.bbox.maxy] ;
      }
      const mapService = GUI.getComponent('map').getService();
      mapService.goToBBox(bbox);
      this._hideMenu();
    },
    canShowWmsUrl(layerId) {
      const originalLayer = CatalogLayersStoresRegistry.getLayerById(layerId);
      return !!originalLayer.getFullWmsUrl()
    },
    canDownloadShp(layerId) {
      const layer = CatalogLayersStoresRegistry.getLayerById(layerId);
      return layer.isShpDownlodable();
    },
    copyWmsUrl(evt, url) {
      let ancorEement = document.createElement('a');
      ancorEement.href = url;
      const tempInput = document.createElement('input');
      tempInput.value = ancorEement.href;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      $(evt.target).attr('data-original-title', t('sdk.catalog.menu.wms.copied')).tooltip('show');
      $(evt.target).attr('title', this.copywmsurltooltip).tooltip('fixTitle');
      document.body.removeChild(tempInput);
      ancorEement = null;
    },
    showWMSUrl(layerId) {
      const originalLayer = CatalogLayersStoresRegistry.getLayerById(layerId);
      return originalLayer.getFullWmsUrl();
    },
    downloadShp(layerId) {
      this.layerMenu.loading.shp = true;
      const layer = CatalogLayersStoresRegistry.getLayerById(layerId);
      layer.getShp().catch((err) => {
        GUI.notify.error(t("info.server_error"));
      }).finally(() => {
        this.layerMenu.loading.shp = false;
        this._hideMenu();
      })
    },
    showAttributeTable: function(layerId) {
      this.layerMenu.loading.data_table = false;
      GUI.closeContent();
      const layer = CatalogLayersStoresRegistry.getLayerById(layerId);
      this.layerMenu.loading.data_table = true;
      const tableContent = new TableComponent({
        layer
      });
      tableContent.on('show', () => {
        if (this.isMobile()) {
          GUI.hideSidebar();
        }
        this.layerMenu.loading.data_table = false;
        this._hideMenu();
      });
      tableContent.show({
        title: layer.getName()
      });
    },
    startEditing: function() {
      let layer;
      const catallogLayersStores = CatalogLayersStoresRegistry.getLayersStores();
      catallogLayersStores.forEach((layerStore) => {
        layer = layerStore.getLayerById(this.layerMenu.layer.id);
        if (layer) {
          layer.getLayerForEditing();
          return false;
        }
      });
    },
    closeLayerMenu: function() {
      this._hideMenu();
      this.showColorMenu(false);
    },
    onChangeColor: function(val) {
      const mapService = GUI.getComponent('map').getService();
      this.layerMenu.colorMenu.color = val;
      const layer = mapService.getLayerByName(this.layerMenu.name);
      layer.setStyle(mapService.setExternalLayerColor(val));
    },
    showColorMenu: function(bool, evt) {
      if(bool) {
        const elem = $(evt.target);
        this.layerMenu.colorMenu.top = elem.offset().top;
        this.layerMenu.colorMenu.left = elem.offset().left + elem.width() + ((elem.outerWidth() - elem.width()) /2);
      }
      this.layerMenu.colorMenu.show = bool;
    },
    layout(size) {
      console.log(size)
    }
  },
  created() {
    CatalogEventHub.$on('treenodetoogled', (storeid, node, parent_mutually_exclusive) => {
      const mapService = GUI.getComponent('map').getService();
      if(node.external) {
        let layer = mapService.getLayerByName(node.name);
        layer.setVisible(!layer.getVisible());
        node.visible = !node.visible;
      } else if(!storeid) {
        node.visible = !node.visible;
        let layer = mapService.getLayerById(node.id);
        layer.setVisible(node.visible);
      } else {
        let layer = CatalogLayersStoresRegistry.getLayersStore(storeid).toggleLayer(node.id, null, parent_mutually_exclusive);
        mapService.emit('cataloglayertoggled', layer);
      }
    });
    // event that set all visible or not all children layer of the folder and if parent is mutually exclusive turn off all layer
    CatalogEventHub.$on('treenodestoogled', (storeid, nodes, isFolderChecked) => {
      let layersIds = [];
      let checkNodes = (obj) => {
        if(obj.nodes) {
          if(obj.mutually_exclusive) {
            if(obj.lastLayerIdVisible)
              layersIds.push(obj.lastLayerIdVisible);
            else {
              if(!isFolderChecked) {
                layersIds = CatalogLayersStoresRegistry.getLayersStore(storeid)._getAllSiblingsChildrenLayersId(obj);
              } else {
                const getLayerIds = (nodes) => {
                  nodes.some((node) => {
                    if(node.id) {
                      if(node.geolayer) {
                        layersIds.push(node.id);
                        return true;
                      }

                    } else {
                      getLayerIds(node.nodes);
                    }
                  })
                };
                getLayerIds(obj.nodes)
              }
            }
          } else {
            obj.nodes.forEach((node) => {
              checkNodes(node);
            });
          }
        } else {
          if(obj.geolayer)
            layersIds.push(obj.id);
        }
      };
      nodes.map(checkNodes);
      CatalogLayersStoresRegistry.getLayersStore(storeid).toggleLayers(layersIds, isFolderChecked).then((layers) => {
        const mapService = GUI.getComponent('map').getService();
        for (const layer of layers) {
          mapService.emit('cataloglayertoggled', layer);
        }
      })
    });

    CatalogEventHub.$on('treenodeselected', function (storeid, node) {
      const mapservice = GUI.getComponent('map').getService();
      let layer = CatalogLayersStoresRegistry.getLayersStore(storeid).getLayerById(node.id);
      if(!layer.isSelected()) {
        CatalogLayersStoresRegistry.getLayersStore(storeid).selectLayer(node.id);
        // emit signal of select layer from catalog
        mapservice.emit('cataloglayerselected', layer);
      } else {
        CatalogLayersStoresRegistry.getLayersStore(storeid).unselectLayer(node.id);
        mapservice.emit('cataloglayerunselected', layer);
      }
    });

    CatalogEventHub.$on('showmenulayer', (layerstree, evt) => {
      const layerId = layerstree.id;
      const constMenuHeight = ((layerId) => {
        return (1*this.canShowWmsUrl(layerId)
          + 1*!!layerstree.bbox
          + 1*!!layerstree.openattributetable
          + 1*!!layerstree.color
          + 1*this.canDownloadShp(layerId)) * 30;
      })(layerId);
      this.layerMenu.top = evt.y - constMenuHeight;
      this.layerMenu.left = evt.x;
      this.layerMenu.name = layerstree.name;
      this.layerMenu.layer = layerstree;
      this.layerMenu.show = true;
      this.layerMenu.colorMenu.color = layerstree.color;
    });

    ControlsRegistry.onafter('registerControl', (id, control) => {
      if (id === 'querybbox') {
        control.getInteraction().on('propertychange', (evt) => {
          if(evt.key === 'active') {
            this.state.highlightlayers = !evt.oldValue;
          }
        })
      }
    });
  },
  mounted() {
    this.$nextTick(() => {
      $('.catalog-menu-wms').tooltip();
    })
  }
};

const InternalComponent = Vue.extend(vueComponentOptions);

Vue.component('g3w-catalog', vueComponentOptions);


Vue.component('layers-group', {
  template: require('./layersgroup.html'),
  props: {
    layersgroup: {
      type: Object
    }
  }
});


/* CHILDREN COMPONENTS */
// tree component
Vue.component('tristate-tree', {
  template: require('./tristate-tree.html'),
  props : ['layerstree', 'storeid', 'highlightlayers', 'parent_mutually_exclusive', 'parentFolder', 'externallayers', 'root', "parent"],
  data: function () {
    return {
      expanded: this.layerstree.expanded,
      isFolderChecked: true,
      controltoggled: false,
      n_childs: null,
      ishighligtable: false
    }
  },
  computed: {
    isFolder: function() {
      let _visibleChilds = 0;
      let _childsLength = 0;
      const isFolder = !!this.layerstree.nodes;
      if (isFolder) {
        // function that count number of layers of each folder and visible layers
        let countLayersVisible = (layerstree) => {
          //if mutually exclusive count 1
          if (layerstree.mutually_exclusive) {
            _childsLength+=1;
            layerstree.nodes.forEach((layer) => {
              if (!layer.nodes) {
                if (layer.visible) {
                  layerstree.lastLayerIdVisible = layer.id;
                  _visibleChilds += 1;
                }
              } else {
                const countMEVisibleLayers = (nodes) => {
                  const vME = nodes.reduce((previous, node) => {
                      if (node.id) return node.visible || previous;
                      else return countMEVisibleLayers(node.nodes) || previous;
                    }
                    , false);
                  return vME;
                };
                _visibleChilds += countMEVisibleLayers(layer.nodes);
              }
            })
          } else { // not mutually exclusive
            layerstree.nodes.forEach((layer) => {
              if (!layer.nodes && layer.geolayer) {
                  _childsLength+=1;
                if (layer.visible) {
                  _visibleChilds += 1;
                }
              } else if (layer.nodes) {
                countLayersVisible(layer);
              }
            });
          }
        };
        countLayersVisible(this.layerstree);
        this.n_childs = _childsLength;
        this.n_visibleChilds = _visibleChilds;
        //set folder is checked based on the behaviour of the child
        this.isFolderChecked = !(this.n_childs - this.n_visibleChilds);
      }
      return isFolder
    },
    isTable: function() {
      if (!this.isFolder) {
        return !this.layerstree.geolayer && !this.layerstree.external;
      }
    },
    isHidden: function() {
      return this.layerstree.hidden && (this.layerstree.hidden === true);
    },
    selected: function() {
      const isSelected = this.layerstree.selected ? "SI" : "NO";
      return isSelected;
    },
    isHighLight: function() {
      return this.highlightlayers && !this.isFolder && this.ishighligtable && this.layerstree.visible;
    }
  },
  methods: {
    toggle: function(isFolder) {
      if (isFolder) {
        //check if group is mutually exclusive and has children
        if (this.layerstree.mutually_exclusive && this.layerstree.nodes.length) {
          if (!this.layerstree.lastLayerIdVisible) {
            let layerId;
            const getLayerId = (nodes) => {
              nodes.some((node) => {
                if (node.id)
                  if (node.geolayer) {
                  layerId = node.id;
                  return true
                } else {
                  getLayerId(node.nodes);
                }
              });
            };
            getLayerId(this.layerstree.nodes);
            this.layerstree.lastLayerIdVisible = layerId;
          }
          if (!this.isFolderChecked) {
            CatalogEventHub.$emit('treenodetoogled', this.storeid, {
              id: this.layerstree.lastLayerIdVisible //id of visible layers
            }, this.layerstree.mutually_exclusive);
          } else {
            CatalogEventHub.$emit('treenodestoogled', this.storeid, this.layerstree.nodes, false, this.parent_mutually_exclusive)
          }
          this.isFolderChecked = !this.isFolderChecked;
        } else {
          if (this.isFolderChecked && !this.n_visibleChilds) {
            this.isFolderChecked = true;
          } else if (this.isFolderChecked && this.n_visibleChilds) {
            this.isFolderChecked = false;
          } else {
            this.isFolderChecked = !this.isFolderChecked;
          }
          CatalogEventHub.$emit('treenodestoogled', this.storeid, this.layerstree.nodes, this.isFolderChecked, this.parent_mutually_exclusive);
        }
        if (this.isFolderChecked && this.parent_mutually_exclusive) {
          this.parent.nodes.forEach((node) => {
            let nodes = [];
            if (node.title != this.layerstree.title)
              nodes.push(node);
            CatalogEventHub.$emit('treenodestoogled', this.storeid, nodes, false, this.parent_mutually_exclusive)
          })
        }
      } else {
        CatalogEventHub.$emit('treenodetoogled', this.storeid, this.layerstree, this.parent_mutually_exclusive);
      }
    },
    expandCollapse: function() {
      this.layerstree.expanded = !this.layerstree.expanded;
    },
    select: function () {
      if (!this.isFolder && !this.layerstree.external && !this.isTable) {
        CatalogEventHub.$emit('treenodeselected',this.storeid, this.layerstree);
      }
    },
    triClass: function () {
      if (this.n_visibleChilds == this.n_childs) {
        //checked
        return this.g3wtemplate.getFontClass('check');
      } else if ((this.n_visibleChilds > 0) && (this.n_visibleChilds < this.n_childs)) {
        if (this.layerstree.mutually_exclusive) {
          //checked
          return this.g3wtemplate.getFontClass('uncheck');
        }
        // white square
        return this.g3wtemplate.getFontClass('filluncheck');
      } else {
        //unchecked
        return this.g3wtemplate.getFontClass('uncheck');
      }
    },
    removeExternalLayer: function(name) {
      const mapService = GUI.getComponent('map').getService();
      mapService.removeExternalLayer(name);
    },
    showLayerMenu: function(layerstree, evt) {
      if (!this.isFolder && (this.layerstree.openattributetable || this.layerstree.geolayer || this.layerstree.external)) {
        CatalogEventHub.$emit('showmenulayer', layerstree, evt);
      }
    }
  },
  created() {
    if (!this.isFolder) {
      const layer = CatalogLayersStoresRegistry.getLayerById(this.layerstree.id);
      this.ishighligtable = layer && layer.isFilterable();
    }
  },
  mounted: function() {
    if (this.isFolder && !this.root) {
      this.layerstree.nodes.forEach((node) => {
        if (this.parent_mutually_exclusive && !this.layerstree.mutually_exclusive) {
          if (node.id)
            node.uncheckable = true;
        }
      })
    }
  }
});

Vue.component('layerslegend',{
    template: require('./legend.html'),
    props: ['layerstree'],
    data: function() {
      return {}
    },
    computed: {
      visiblelayers: function(){
        let _visiblelayers = [];
        const layerstree = this.layerstree.tree;
        let traverse = (obj) => {
          for (const layer of obj) {
            if (!_.isNil(layer.id) && layer.visible && !layer.exclude_from_legend) {
              _visiblelayers.push(layer);
            }
            if (!_.isNil(layer.nodes)) {
              traverse(layer.nodes);
            }
          }
        };
        traverse(layerstree);
        return _visiblelayers;
      }
    },
    watch: {
      'layerstree': {
        handler: function(val, old){},
        deep: true
      },
      'visiblelayers'(visibleLayers) {
        const show = !!visibleLayers.length;
        this.$emit('showlegend', show)
      }
    },
    created() {
      this.$emit('showlegend', !!this.visiblelayers.length);
    },
    mounted: function() {
      this.$nextTick(function() {
        $('.legend-item').perfectScrollbar();
      });
    }
});

Vue.component('layerslegend-items',{
  template: require('./legend_items.html'),
  props: ['layers'],
  computed: {
    legendurls() {
      const urlLayersName = {};
      const legendUrls = [];
      const layers = this.layers.reverse();
      for (let i=0; i< layers.length; i++) {
        const layer = layers[i];
        const url = this.getLegendUrl(layer);
        const [prefix, layerName] = url.split('LAYER=');
        if (!urlLayersName[prefix])
          urlLayersName[prefix] = [];
        urlLayersName[prefix].push(layerName)
      }
      for (const url in urlLayersName) {
        const legendUrl = `${url}&LAYER=${urlLayersName[url].join(',')}`;
        legendUrls.push(legendUrl);
      }
      return legendUrls
    }
  },
  methods: {
    getLegendUrl: function(layer) {
      let _legendurl;
      const catalogLayers = CatalogLayersStoresRegistry.getLayersStores();
      catalogLayers.forEach((layerStore) => {
        if (layerStore.getLayerById(layer.id)){
          _legendurl = layerStore.getLayerById(layer.id).getLegendUrl();
          return false
        }
      });
      return _legendurl;
    },
    updateLegendScroll: function(evt) {
      $(evt.target).perfectScrollbar('update');
    }
  }
});


function CatalogComponent(options={}) {
  options.resizable = true;
  base(this, options);
  this.title = "catalog";
  this.mapComponentId = options.mapcomponentid;
  const service = options.service || new Service;
  this.setService(service);
  this.setInternalComponent(new InternalComponent({
    service: service
  }));
  this.internalComponent.state = this.getService().state;
  let listenToMapVisibility = (map) => {
    const mapService = map.getService();
    this.state.visible = !mapService.state.hidden;
    mapService.onafter('setHidden',(hidden) => {
      this.state.visible = !mapService.state.hidden;
      this.state.expanded = true;
    })
  };
  if (this.mapComponentId) {
    const map = GUI.getComponent(this.mapComponentId);
    if (!map) {
      ComponentsRegistry.on('componentregistered', (component) => {
        if (component.getId() == this.mapComponentId) {
          listenToMapVisibility(component);
        }
      })
    }
    else {
      listenToMapVisibility(map)
    }
  }
}

inherit(CatalogComponent, Component);

module.exports = CatalogComponent;
