<template>
  <div id="open_attribute_table">
    <b style="color:#3f8dbc; margin-bottom:3px;">{{ state.title }}</b>
    <table v-if="hasHeaders()" id="layer_attribute_table" class="table table-striped" style="width:100%">
      <thead>
      <tr>
        <th v-for="header in state.headers">{{ header.label }}</th>
      </tr>
      </thead>
      <tbody>
      <tr :id="'open_table_row_' + index"  v-for="(feature, index) in state.features" :key="index" @mouseenter="zoomAndHighLightSelectedFeature(feature, false)" @click="zoomAndHighLightSelectedFeature(feature)" :class="{geometry: state.hasGeometry}">
        <td v-for="header in state.headers">
          <link-item v-if="getFieldType(feature.attributes[header.name]) == 'link'" :href="feature.attributes[header.name].value"></link-item>
          <g3w-geospatial v-else-if="getFieldType(feature.attributes[header.name]) == 'geo'" :data="feature.attributes[header.name]"></g3w-geospatial>
          <g3w-image v-else-if="getFieldType(feature.attributes[header.name]) == 'photo'" :value="feature.attributes[header.name].value"></g3w-image>
          <p v-else>{{ sanitizeFieldValue(feature.attributes[header.name]) }}</p>
        </td>
      </tr>
      </tbody>
    </table>
    <div id="nohedaers" v-t="'dataTable.no_data'" v-else>
    </div>
  </div>
</template>

<script>
  import LinkComponent from './components/link.vue'
  const fieldsMixin = require('gui/vue/vue.mixins').fieldsMixin;
  export default {
    name: "Table",
    mixins: [fieldsMixin],
    data: function() {
      return {
        state: null,
        table: null
      }
    },
    components: {
      'link-item': LinkComponent
    },
    methods: {
      _setLayout: function() {
        this.$options.service._setLayout();
      },
      zoomAndHighLightSelectedFeature: function(feature, zoom=true) {
        if (this.state.geometry)
          this.$options.service.zoomAndHighLightSelectedFeature(feature, zoom);
      },
      hasHeaders() {
        return !!this.state.headers.length;
      }
    },
    mounted: function() {
      this.$nextTick(() => {
        if (this.state.pagination) {
          //pagination
          const table = $('#open_attribute_table table').DataTable({
            "lengthMenu": this.state.pageLengths,
            "scrollX": true,
            "scrollCollapse": true,
            "order": [ 0, 'asc' ],
            "columns": this.state.headers,
            "ajax": (data, callback) => {
              this.$options.service.getData(data)
                .then((dataTable) => {
                  callback(dataTable);
                  this.$nextTick(() => {
                    $('#open_attribute_table table tr.odd').remove();
                    $('#open_attribute_table table tr.even').remove();
                  })
                })
            },
            "serverSide": true,
            "processing": true,
            "deferLoading": this.state.allfeatures
          });
        } else {
          // no pagination all data
          const table = $('#open_attribute_table table').DataTable({
            "lengthMenu": this.state.pageLengths,
            "scrollX": true,
            "scrollCollapse": true,
            "order": [ 0, 'asc' ],
          });
        }
      });
    }
  }
</script>

<style scoped>
  .geometry {
    cursor: pointer
  }
  #nohedaers {
    background-color: #ffffff;
    font-weight: bold;
    margin-top: 10px;
  }
</style>
