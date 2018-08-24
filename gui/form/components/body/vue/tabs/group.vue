<template>
  <div class="tab-group">
    <h5 v-if="group.showlabel">{{ group.name }}</h5>
    <!--<template v-for="field in groupfields">-->
      <!--<component-->
        <!--:state="field"-->
        <!--@changeinput="changeInput"-->
        <!--:is="field.input.type+'_input'">-->
      <!--</component>-->
    <!--</template>-->
    <div v-for="r in rows" class="row">
      <div v-for="c in columnNumber" :class="columnClass">
        <component v-if="!!columnField(r, c)"
            :state="columnField(r, c)"
            @changeinput="changeInput"
            :is="columnField(r, c).input.type+'_input'">
        </component>
      </div>
    </div>
    <div v-for="group in groupsofgroup" class="sub-group">
      <group  @changeinput="changeInput"
              :fields="fields"
              :group="group">
      </group>
    </div>
  </div>
</template>

<script>
  const Inputs = require('gui/inputs/inputs');
  const TabMixins = require('./tabsmixins');
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
    name: "group",
    mixins: [TabMixins],
    props: ['group', 'fields'],
    components: {
      ...Inputs
    },
    computed: {
      groupfields() {
        return this.fields.filter((field) => {
          return this.group.nodes.find((group_field) => {
            return field.name === group_field.field_name;
          })
        })
      },
      groupsofgroup() {
        return this.group.nodes.filter((node) => {
          return node.groupbox;
        })
      },
      rows() {
        let rowCount = 1;
        if (this.columnNumber  <= this.groupfields.length) {
          const rest = this.groupfields.length % this.columnNumber;
          rowCount = Math.floor(this.groupfields.length / this.columnNumber) + rest;
        }
        return rowCount;

      },
      columnClass() {
        return COLUMNCLASSES[this.columnNumber];
      },
      columnNumber() {
        const columnCount = parseInt(this.group.columncount);
        return columnCount > this.groupfields.length ? this.groupfields.length:  columnCount;
      }
    },
    methods: {
      getFields(row) {
        const startIndex = (row - 1) * this.columnNumber;
        return this.groupfields.slice(startIndex, this.columnNumber + startIndex);
      },
      columnField(row, column) {
        const field = this.getFields(row)[column-1];
        return field;
      }
    },
    created() {
      console.log(this.group.nodes)
    }
  }
</script>

<style scoped>
  .tab-group {
    border-bottom:1px solid #dddddd;
    padding: 5px;
    margin-bottom: 5px;
  }
  .sub-group {
    border-bottom:0;
    border-top:1px solid #cecece;
    margin-left: 30px;
  }
</style>
