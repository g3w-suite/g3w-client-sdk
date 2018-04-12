<template>
  <div id="open_attribute_table" class="">
    <b style="color:#3f8dbc; margin-bottom:3px;">{{ state.title }}</b>
    <table id="layer_attribute_table" class="table table-striped" style="width:100%">
      <thead>
      <tr>
        <th v-for="header in state.headers">{{ header.label }}</th>
      </tr>
      </thead>
      <tbody>
      <tr :id="'open_table_row_' + index"  v-for="(feature, index) in state.features" :key="index" @mouseenter="zoomAndHighLightSelectedFeature(feature, false)" @click="zoomAndHighLightSelectedFeature(feature)" :class="{geometry: state.hasGeometry}">
        <td v-for="header in state.headers">
          <link-item v-if="getType(feature.attributes[header.name]) == 'link'" :href="feature.attributes[header.name]"></link-item>
          <geo-item v-else-if="getType(feature.attributes[header.name]) == 'geo'" :data="feature.attributes[header.name]"></geo-item>
          <gallery-images v-else-if="getType(feature.attributes[header.name]) == 'gallery'" :value="feature.attributes[header.name]"></gallery-images>
          <p v-else>{{ feature.attributes[header.name] }}</p>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
  import GeoComponent from './components/geo.vue';
  import LinkComponent from './components/link.vue'
  import ImageComponet from './components/image.vue';
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
      'link-item': LinkComponent,
      'geo-item': GeoComponent,
      'gallery-images': ImageComponet
    },
    methods: {
      _setLayout: function() {
        this.$options.service._setLayout();
      },
      zoomAndHighLightSelectedFeature: function(feature, zoom=true) {
        if (this.state.geometry)
          this.$options.service.zoomAndHighLightSelectedFeature(feature, zoom);
      }
    },
    mounted: function() {
      this.$nextTick(() => {
        if (this.state.pagination) {
          //pagination
          this.table = $('#open_attribute_table table').DataTable({
            "lengthMenu": this.state.pageLengths,
            "scrollX": true,
            "scrollCollapse": true,
            "order": [ 0, 'asc' ],
            "searching": false,
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
          this.table = $('#open_attribute_table table').DataTable({
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
</style>
