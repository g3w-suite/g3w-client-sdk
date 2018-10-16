<template>
  <div class="group">
    <h5 class="title group-title" v-if="showGroupTile">{{ node.name }}</h5>
    <div v-for="row in rows" class="row">
      <div v-for="column in columnNumber" :class="columnClass">
        <template v-if="getNode(row, column)">
          <component v-if="getNodeType(getNode(row, column)) == 'field'"
            :state="getField(getNode(row, column))"
            @changeinput="changeInput"
            @addinput="addToValidate"
            :is="getComponent(getField(getNode(row, column)))">
          </component>
          <template v-else>
            <div v-if="getNodeType(getNode(row, column)) == 'group'" class="sub-group">
              <node
                :contenttype="contenttype"
                @changeinput="changeInput"
                @addinput="addToValidate"
                :fields="fields"
                :showTitle="true"
                :changeInput="changeInput"
                :addToValidate="addToValidate"
                :node="getNode(row, column)">
              </node>
            </div>
            <template v-else>
              <div style="cursor: pointer" v-if="context == 'query'" @click="showRelation(getNode(row, column).name)">
                <div class="query_relation_field" >
                  <i :class="g3wtemplate.font['relation']"></i>
                </div>
                <span>
                  <span class="query_relation_field_message">
                    <span v-t="'mapcontrols.query.input_relation'"></span><span style="text-transform: uppercase"> {{ getRelationName(getNode(row, column).name) }}</span></span>
                </span>
              </div>
              <template v-else>
                <div class="form_editing_relation_input" v-t="'editing.messages.qgis_input_widget_relation'">
                  <span class="info_helptext_button">i</span>
                </div>
              </template>
            </template>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  const Inputs = require('gui/inputs/inputs');
  const Fields = require('gui/fields/fields');
  const ProjectRegistry = require('core/project/projectsregistry');
  const RelationsService = require('core/relations/relationsservice');
  const RelationPage = require('gui/relations/vue/relationspage');
  const GUI = require('gui/gui');
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
    props: ['contenttype', 'node', 'fields', 'showTitle', 'addToValidate', 'changeInput'],
    components: {
      ...Inputs,
      ...Fields
    },
    data() {
      return {
        context: this.contenttype
      }
    },
    computed: {
      filterNodes() {
        const filterNodes = this.node.nodes.filter((node) => {
          if (this.getNodeType(node) === 'group') {
            return true
          } else if (!node.nodes && node.name && this.getNodeType(node) != 'group') {
            node.relation = true;
            return true
          } else {
            return !!this.fields.find((field) => {
              return field.name === node.field_name || node.relation
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
      getRelationName(relationId) {
        const relation = ProjectRegistry.getCurrentProject().getRelationById(relationId);
        return relation.name;
      },
      showRelation(relationId) {
        const relationService = new RelationsService();
        const relation = ProjectRegistry.getCurrentProject().getRelationById(relationId);
        const field = this.fields.find((field) => {
          return field.name === relation.fieldRef.referencedField;
        });
        const value = field.value;
        relationService.getRelations({
          value,
          id: relationId
        }).then((response) => {
          const content = new RelationPage({
            currentview: 'relation',
            relations: [relation],
            relation,
            table: response
          })
          GUI.pushContent({
            content,
            perc: 100
          })
        })
      },
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
        if (node.relation) {
          return node;
        }
        const field = this.fields.find((field) => {
          return field.name === node.field_name;
        });
        return field;
      },
      getNodeType(node) {
        return node.groupbox || node.nodes ? 'group' : node.relation ? 'relation': 'field';
      },
      getComponent(field) {
        if (field.relation) {
          return
        }
        else if (field.query) {
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
  .title {
    font-weight: bold;
    font-size: 1.1em;
    width: 100%;
    color: #ffffff;
    padding: 5px;
    border-radius: 2px;
  }
  .row {
    margin-bottom: 5px;
  }
</style>
