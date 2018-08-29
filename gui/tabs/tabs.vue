<template>
  <div>
    <ul class="formtabs nav nav-tabs">
      <li v-for="(tab, index) in tabs" :class="{active: index === 0}">
        <a data-toggle="tab" :href="'#'+ tab._id" style="font-weight: bold;">{{tab.name}}</a>
      </li>
    </ul>
    <div class="tab-content">
      <div :id="tab._id" class="tab-pane fade" v-for="(tab, index) in tabs" :key="index" :class="{'in active': index === 0}">
        <node
          :fields="fields"
          :showTitle="false"
          :node="tab">
        </node>
      </div>
    </div>
  </div>
</template>

<script>
  import Node from "./node.vue";
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
      Node
    },
    created() {
      let unique_suffix = 0;
      for (tab of this.tabs) {
        tab._id = `form_tab_${unique_suffix}`;
        unique_suffix+=1;
      }
    }
  }
</script>

<style scoped>
  .formtabs {
    overflow: hidden !important;
  }
  .tab-content {
    margin-top: 10px;
  }

</style>
