<template>
  <div>
    <ul class="nav nav-tabs">
      <li v-for="(tab, index) in tabs" :class="{active: index === 0}">
        <a data-toggle="tab" :href="'#'+ tab.name" style="font-weight: bold;">{{tab.name}}</a>
      </li>
    </ul>
    <div class="tab-content">
      <div :id="tab.name" class="tab-pane fade" v-for="(tab, index) in tabs" :key="index" :class="{'in active': index === 0}">
        <template v-for="node in tab.nodes">
          <group :fields="fields"
                 @changeinput="changeInput"
                 v-if="getNodeType(node) === 'group'"
                 :group="node">
          </group>
          <component v-else
            @changeinput="changeInput"
            :state="getField(node.field_name)"
            :is="getField(node.field_name).input.type+'_input'">
          </component>
        </template>

      </div>
    </div>
  </div>
</template>

<script>
  import Group from './group.vue';
  const Inputs = require('gui/inputs/inputs');
  const TabMixins = require('./tabsmixins');
  export default {
    name: "tabs",
    mixins: [TabMixins],
    props: ['tabs', 'fields'],
    methods: {
      getField(fieldName) {
        const tabfields = this.fields.find((field) => {
          return field.name === fieldName;
        });
        return tabfields;
      }
    },
    components: {
      Group,
      ...Inputs
    }
  }
</script>

<style scoped>
  .tab-content {
    margin-top: 10px;
  }

</style>
