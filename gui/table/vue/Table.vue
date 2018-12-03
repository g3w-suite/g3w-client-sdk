<template>
  <div id="open_attribute_table">
    <table v-if="hasHeaders()" id="layer_attribute_table" class="table table-striped display compact nowrap" style="width:100%">
      <thead>
        <tr>
          <th v-for="header in state.headers">{{ header.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr class="feature_attribute" :id="'open_table_row_' + index"  v-for="(feature, index) in state.features" :key="index" @click="zoomAndHighLightSelectedFeature(feature); toggleRow(index)" :selected="selectedRow === index" :class="[{geometry: state.hasGeometry}]">
          <td v-for="header in state.headers">
            <field :state="{value: feature.attributes[header.name]}"></field>
          </td>
        </tr>
      </tbody>
    </table>
    <div id="noheaders" v-t="'dataTable.no_data'" v-else>
    </div>
  </div>
</template>

<script>
  const Field = require('gui/fields/g3w-field.vue');
  let dataTable;
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
      },
      reloadLayout() {
        this.$nextTick(() => {
          dataTable.columns.adjust();
        });
      }
    },
    created() {},
    mounted: function() {
      const hideElements = () => {
        $('.dataTables_info, .dataTables_length').hide();
        $('#layer_attribute_table_previous, #layer_attribute_table_next').hide();
        $('.dataTables_filter').css('float', 'right');
        $('.dataTables_paginate').css('margin', '0px');
      };
      this.$nextTick(() => {
        if (this.state.pagination) {
          //pagination
          dataTable = $('#open_attribute_table table').DataTable({
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
                    hideElements();
                  })
                })
            },
            "serverSide": true,
            "processing": true,
            "responsive": true,
            "deferLoading": this.state.allfeatures
          });
        } else {
          // no pagination all data
          dataTable = $('#open_attribute_table table').DataTable({
            "lengthMenu": this.state.pageLengths,
            "scrollX": true,
            "scrollCollapse": true,
            "order": [ 0, 'asc' ],
            "responsive": true,
          });
        }
        if (this.isMobile()) {
          hideElements();
        }
        const tableHeight = $(".content").height();
        const tableHeaderHeight = $('#open_attribute_table  div.dataTables_scrollHeadInner').height();
        $('#open_attribute_table  div.dataTables_scrollBody').height(tableHeight - tableHeaderHeight - 130);
      });
    },
    beforeDestroy() {
      dataTable.destroy();
    }
  }
</script>

<style scoped>
  .geometry {
    cursor: pointer
  }
  #noheaders {
    background-color: #ffffff;
    font-weight: bold;
    margin-top: 10px;
  }
  #open_attribute_table {
  }
  </style>
