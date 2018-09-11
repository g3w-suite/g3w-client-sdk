<template>
  <div class="group">
    <h4 class="title" v-if="showGroupTile">{{ node.name }}</h4>
    <div v-for="row in rows" class="row">
      <div v-for="column in columnNumber" :class="columnClass">
        <template v-if="getNode(row, column)">
          <component v-if="getNodeType(getNode(row, column)) == 'field'"
            :state="getField(getNode(row, column))"
            @changeinput="changeInput"
            @addinput="addToValidate"
            :is="getComponent(getField(getNode(row, column)))">
            </component>
          <div v-else class="sub-group">
            <node
              @changeinput="changeInput"
              @addinput="addToValidate"
              :fields="fields"
              :showTitle="true"
              :changeInput="changeInput"
              :addToValidate="addToValidate"
              :node="getNode(row, column)">
            </node>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  const Inputs = require('gui/inputs/inputs');
  const Fields = require('gui/fields/fields');
  const COLUMNCLASSES = {
    1: 'col-md-12',
    2: 'col-md-6',
    3: 'col-md-4',
    4: 'col-md-3',
    5: 'col-md-2',
    6: 'col-md-2',
    7: 'col-md-1',
    8: 'col-md-1',
    9: 'col-md-1',
    10: 'col-md-1',
    11: 'col-md-1',
    12: 'col-md-1',
  };
  export default {
    name: "node",
    props: ['node', 'fields', 'showTitle', 'addToValidate', 'changeInput'],
    components: {
      ...Inputs,
      ...Fields
    },
    computed: {
      filterNodes() {
        const filterNodes = this.node.nodes.filter((node) => {
          if (this.getNodeType(node) === 'group') {
            return true
          } else {
            return !!this.fields.find((field) => {
              return field.name === node.field_name;
            })
          }
        });
        return filterNodes;
      },
      nodesLength() {
        return this.filterNodes.length;
      },
      rows() {
        let rowCount = 1;
        // caso in cui ho un gruppo ma nessun campo associato
        if (this.nodesLength === 0)
          rowCount = 0;
        else if (this.columnNumber  <= this.nodesLength) {
          const rest = this.nodesLength  % this.columnNumber;
          rowCount = Math.floor(this.nodesLength / this.columnNumber) + rest;
        }
        return rowCount;
      },
      columnClass() {
        return COLUMNCLASSES[this.columnNumber];
      },
      columnNumber() {
        const columnCount = parseInt(this.node.columncount);
        return columnCount > this.nodesLength ? this.nodesLength:  columnCount;
      },
      showGroupTile() {
        return this.showTitle && this.node.showlabel && this.node.groupbox
      }
    },
    methods: {
      getNodes(row) {
        const startIndex = (row - 1) * this.columnNumber;
        const nodes = this.filterNodes.slice(startIndex, this.columnNumber + startIndex);
        return nodes;
      },
      getNode(row, column) {
        const node = this.getNodes(row)[column - 1];
        return node;
      },
      getField(node) {
        const field = this.fields.find((field) => {
          return field.name === node.field_name;
        });
        return field;
      },
      getNodeType(node) {
        return node.groupbox ? 'group' : 'field';
      },
      getComponent(field) {
        if (field.query) {
          return field.input.type;
        } else {
          return `${field.input.type}_input`;
        }
      }
    },
    created() {}
  }
</script>

<style scoped>
  .group {
    padding: 5px;
    margin-bottom: 10px;
  }
  .sub-group {
    background-color: rgba(180, 180, 180, 0.1);
    border-radius: 5px;
  }
  .title{
    font-weight: bold;
  }
  .row {
    margin-bottom: 5px;
  }
</style>
