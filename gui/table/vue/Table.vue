<template>
  <div id="open_attribute_table">
    <table v-if="hasHeaders()" id="layer_attribute_table" class="table table-striped" style="width:100%">
      <thead>
        <tr>
          <th v-for="header in state.headers">{{ header.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr :id="'open_table_row_' + index"  v-for="(feature, index) in state.features" :key="index" @mouseenter="zoomAndHighLightSelectedFeature(feature, false)" @click="zoomAndHighLightSelectedFeature(feature); toggleRow(index)" :class="[{geometry: state.hasGeometry}, {selected: selectedRow === index }]">
          <td v-for="header in state.headers">
            <field :state="{value: feature.attributes[header.name]}"></field>
          </td>
        </tr>
      </tbody>
    </table>
    <div id="nohedaers" v-t="'dataTable.no_data'" v-else>
    </div>
  </div>
</template>

<script>
  const Field = require('gui/fields/g3w-field.vue');
  export default {
    name: "G3WTable",
    data: function() {
      return {
        state: null,
        table: null,
        selectedRow: null
      }
    },
    components: {
      Field
    },
    methods: {
      _setLayout: function() {
        this.$options.service._setLayout();
      },
      zoomAndHighLightSelectedFeature: function(feature, zoom=true) {
        if (this.state.geometry)
          this.$options.service.zoomAndHighLightSelectedFeature(feature, zoom);
      },
      toggleRow(index) {
        this.selectedRow = this.selectedRow === index ? null : index;
      },
      hasHeaders() {
        return !!this.state.headers.length;
      }
    },
    created() {

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
  .selected {
    background-color: yellow !important;
  }
</style>
