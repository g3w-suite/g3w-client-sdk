<template>
  <div>
    <ul class="formtabs nav nav-tabs">
      <li v-for="(tab, index) in tabs" :class="{active: index === 0}">
        <a data-toggle="tab" :href="'#'+ ids[index]" style="font-weight: bold;">{{tab.name}}</a>
      </li>
    </ul>
    <div class="tab-content">
      <div :id="ids[index]" class="tab-pane fade" v-for="(tab, index) in tabs" :key="ids[index]" :class="{'in active': index === 0}">
        <node
          :addToValidate="addToValidate"
          :changeInput="changeInput"
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
  const getUniqueDomId = require ('core/utils/utils').getUniqueDomId;
  export default {
    name: "tabs",
    props: ['tabs', 'fields', 'addToValidate', 'changeInput'],
    data() {
      return {
        ids : []
      }
    },
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
      for (const tab of this.tabs) {
        this.ids.push(`tab_${getUniqueDomId()}`);
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
