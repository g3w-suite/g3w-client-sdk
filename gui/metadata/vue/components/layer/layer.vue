<template>
  <div>
    <h4 @click="showHideInfo" class="layer_header" data-toggle="collapse" :data-target="'#' + state.id">
      <i class="fa layer-header-icon" :class="[isSpatial ? 'fa-map-o': 'fa-table']" aria-hidden="true"></i>{{ state.name}}
      <span class="fa" :class="[show ? 'fa-eye-slash' : 'fa-eye']"></span>
      </h4>
    <div :id="state.id" class="collapse">
      <ul class="nav nav-tabs" role="tablist">
        <li role="presentation" class="active">
          <a v-t="'metadata.groups.layers.groups.general'" :href="'#layer_general_' + state.id" aria-controls="general" role="tab" data-toggle="tab">
          </a>
        </li>
        <li v-if="isSpatial" role="presentation">
          <a v-t="'metadata.groups.layers.groups.spatial'" :href="'#layer_spatial_' + state.id" aria-controls="profile" role="tab" data-toggle="tab">
          </a>
        </li>
      </ul>
      <!-- Tab panes -->
      <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" :id="'layer_general_' + state.id">
          <div class="container-fluid">
            <div v-if="findAttributeFormMetadataAttribute('title')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.title'" :class="g3wtemplate.getColumnClass({width:['2', '12'], breakpoint:['md', 'sm']})" class="metadata-label"></div>
              <div :class="g3wtemplate.getColumnClass({width:['10', '12'], breakpoint:['md', 'sm']})" class="value">{{ state.metadata.title }}</div>
            </div>
            <div v-if="findMetadataAttribute('name')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.name'" :class="g3wtemplate.getColumnClass({width:['2', '12'], breakpoint:['md', 'sm']})" class="metadata-label"></div>
              <div  :class="g3wtemplate.getColumnClass({width:['10', '12'], breakpoint:['md', 'sm']})" class="value">{{ state.name }}</div>
            </div>
            <div v-if="findMetadataAttribute('source')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.source'" :class="g3wtemplate.getColumnClass({width:['2', '12'], breakpoint:['md', 'sm']})" class="metadata-label"></div>
              <div  :class="g3wtemplate.getColumnClass({width:['10', '12'], breakpoint:['md', 'sm']})" class="value">{{ state.source.type }}</div>
            </div>
            <div v-if="findAttributeFormMetadataAttribute('abstract')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.abstract'" :class="g3wtemplate.getColumnClass({width:['2', '12'], breakpoint:['md', 'sm']})" class="metadata-label"></div>
              <div  :class="g3wtemplate.getColumnClass({width:['10', '12'], breakpoint:['md', 'sm']})" class="value">{{ state.metadata.abstract[0] }}</div>
            </div>
            <div v-if="findAttributeFormMetadataAttribute('keywords')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.keywords'" :class="g3wtemplate.getColumnClass({width:['2', '12'], breakpoint:['md', 'sm']})" class="metadata-label"></div>
              <div :class="g3wtemplate.getColumnClass({width:['10', '12'], breakpoint:['md', 'sm']})" class="value">
                <div>{{ state.metadata.keywords.join(', ') }}</div>
              </div>
            </div>
            <div v-if="findAttributeFormMetadataAttribute('metadataurl') && state.metadata.metadataurl.onlineresources" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.metadataurl'" :class="g3wtemplate.getColumnClass({width:['2', '12'], breakpoint:['md', 'sm']})" class="metadata-label"></div>
              <div  :class="g3wtemplate.getColumnClass({width:['md', 'sm'], breakpoint:['10', '12']})" class="value">
                <a :href="state.metadata.metadataurl.onlineresources">{{ state.metadata.metadataurl.onlineresources }}</a>
              </div>
            </div>
            <div v-if="findAttributeFormMetadataAttribute('dataurl') && state.metadata.dataurl.onlineresources" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.dataurl'" :class="g3wtemplate.getColumnClass({width:['2', '12'], breakpoint:['md', 'sm']})" class="metadata-label"></div>
              <div :class="g3wtemplate.getColumnClass({width:['10', '12'], breakpoint:['md', 'sm']})" class="value">
                <a :href="state.metadata.dataurl.onlineresources">{{ state.metadata.dataurl.onlineresources }}</a>
              </div>
            </div>
            <div v-if="findAttributeFormMetadataAttribute('attributes')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.attributes'" :class="g3wtemplate.getColumnClass({width:['2', '12'], breakpoint:['md', 'sm']})" class="metadata-label"></div>
              <div  :class="g3wtemplate.getColumnClass({width:['10', '12'], breakpoint:['md', 'sm']})" class="value" style="overflow: auto;">
                <table class="table">
                  <thead>
                  <tr>
                    <th v-for="(value, header) in state.metadata.attributes[0]">{{ header }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="attribute in state.metadata.attributes">
                    <td v-for="(value, header) in attribute">{{ value }}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div role="tabpanel" class="tab-pane" :id="'layer_spatial_'+state.id">
          <div class="container-fluid">
            <div v-if="findMetadataAttribute('crs')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.crs'" class="col-sm-3 metadata-label"></div>
              <div class="col-sm-9 value">{{ state.crs }}</div>
            </div>
            <div v-if="findMetadataAttribute('geometrytype')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.geometrytype'" class="col-sm-3 metadata-label"></div>
              <div class="col-sm-9 value">{{ state.geometrytype }}</div>
            </div>
            <div v-if="findMetadataAttribute('bbox')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.bbox'" :class="g3wtemplate.getColumnClass({width:'3'})" class="metadata-label"></div>
              <div :class="g3wtemplate.getColumnClass({width:'9'})" class="value">
                <p v-for="(value, key) in state.bbox">
                  <span style="font-weight: bold; margin-right: 5px;">{{ key }}</span>
                  <span>{{ value}}</span>
                </p>
              </div>
            </div>
            <div v-if="findAttributeFormMetadataAttribute('crs')" :class="g3wtemplate.getRowClass()">
              <div v-t="'metadata.groups.layers.fields.subfields.crs'" :class="g3wtemplate.getColumnClass({width:'3'})" class="metadata-label"></div>
              <div :class="g3wtemplate.getColumnClass({width:'9'})" class="value">
                <div v-for="crs in state.metadata.crs">
                  <span>{{ crs }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import MetadataMixin from '../metadatamixin';

  export default {
    name: "layer",
    mixins: [MetadataMixin],
    props: {
      state: {}
    },
    data() {
      return {
        show: false
      }
    },
    computed: {
      isSpatial() {
        return this.state.geometrytype != 'No geometry'
      }
    },
    methods: {
      showHideInfo() {
        this.show = !this.show;
      },
    },
    mounted() {}
  }
</script>

<style scoped>
  .layer_header {
    border-bottom: 1px solid rgba(226, 226, 226, 0.3);
    padding-bottom: 10px;
    cursor: pointer;
    color: #2c3b41;
    font-weight: bold;
  }
  .layer-header-icon {
    margin-right: 10px;
  }
  .layer_header span {
    position: absolute;
    right: 5px;
  }
  .metadata-label {
    font-weight: bold;
    font-size: 1.1em;
  }
  .row {
    margin-bottom: 10px;
  }
  .nav-tabs { border-bottom: 0px solid #DDD; }
  .nav-tabs > li.active > a, .nav-tabs > li.active > a:focus, .nav-tabs > li.active > a:hover { border-width: 0; }
  .nav-tabs > li > a { border: none; color: #aeaeae; }
  .nav-tabs > li.active > a, .nav-tabs > li > a:hover { border: none; color: #3c8dbc !important; background: transparent; }
  .nav-tabs > li > a::after { content: ""; background: #3c8dbc; height: 2px; position: absolute; width: 100%; left: 0px; bottom: -1px; transition: all 250ms ease 0s; transform: scale(0); }
  .nav-tabs > li.active > a::after, .nav-tabs > li:hover > a::after { transform: scale(1); }
  .tab-nav > li > a::after { background: #21527d none repeat scroll 0% 0%; color: #fff; }
  .tab-pane { padding: 15px 0; }
  .tab-content {
    padding: 20px;
    background-color: #f9f9f9;
    overflow: auto;
  }

</style>
