<template>
  <div>
    <h4 @click="showHideInfo" class="layer_header" data-toggle="collapse" :data-target="'#' + state.id">
      <i class="fa layer-header-icon" :class="[isSpatial ? 'fa-map-o': 'fa-table']" aria-hidden="true"></i>{{ state.metadata.title }}
      <span class="fa" :class="[show ? 'fa-eye-slash' : 'fa-eye']"></span>
      </h4>
    <div :id="state.id" class="collapse">
      <ul class="nav nav-tabs" role="tablist">
        <li role="presentation" class="active">
          <a :href="'#layer_general_' + state.id" aria-controls="general" role="tab" data-toggle="tab">
            Generale
          </a>
        </li>
        <li v-if="isSpatial" role="presentation">
          <a :href="'#layer_spatial_' + state.id" aria-controls="profile" role="tab" data-toggle="tab">
            Info Spaziali
          </a>
        </li>
      </ul>
      <!-- Tab panes -->
      <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" :id="'layer_general_' + state.id">
          <div class="container-fluid">
            <div class="row">
              <div class="col-lg-2 col-md-2 col-sm-12 metadata-label">Titolo</div>
              <div class="col-lg-10 col-md-10 col-sm-12 value">{{ state.metadata.title }}</div>
            </div>
            <div v-if="state.source" class="row">
              <div class="col-lg-2 col-md-2 col-sm-12 col-md-2 col-sm-12 metadata-label">Sorgente</div>
              <div class="col-lg-10 col-md-10 col-sm-12 value">{{ state.source.type }}</div>
            </div>
            <div class="row">
              <div class="col-lg-2 col-md-2 col-sm-12 metadata-label">Attributi</div>
              <div class="col-lg-10 col-md-10 col-sm-12 value" style="overflow: auto;">
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
            <div class="row">
              <div class="col-sm-3 metadata-label">EPSG</div>
              <div class="col-sm-9 value">{{ state.crs }}</div>
            </div>
            <div class="row">
              <div class="col-sm-3 metadata-label">Geometria</div>
              <div class="col-sm-9 value">{{ state.geometrytype }}</div>
            </div>
            <div v-if="state.bbox" class="row">
              <div class="col-sm-3 metadata-label">BBOX</div>
              <div class="col-sm-9 value">
                <p v-for="(value, key) in state.bbox">
                  <span style="font-weight: bold; margin-right: 5px;">{{ key }}</span>
                  <span>{{ value}}</span>
                </p>
              </div>
            </div>
            <div v-if="state.metadata && state.metadata.crs" class="row">
              <div class="col-sm-3 metadata-label">CRS</div>
              <div class="col-sm-9 value">
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
  export default {
    name: "layer",
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
