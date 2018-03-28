<template>
  <div>
    <div class="col-sm-3 metadata-label">{{ data.label }} </div>
    <div v-if="fieldName == 'keywords'" class="col-sm-9 value">
      {{ arrayToString }}
    </div>
    <div v-else-if="fieldName == 'wms_url'" class="col-sm-9 value" style="margin-top:0">
      <a :href="data.value">{{ data.value }}</a>
    </div>
    <div v-else-if="!isArrayorObject(data.value)" class="col-sm-9 value" style="margin-top:0">
      {{ data.value }}
    </div>
    <div v-else class="col-sm-9 value" style="margin-top:0">
      <div v-for="(value, key) in data.value">
        <span>{{ value }}</span>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "metadatatabcontent",
    props: {
      data: {},
      fieldName: {}
    },
    computed: {
      arrayToString() {
        return this.data.value.join(', ')
      }
    },
    methods: {
      isArrayorObject(value) {
        return Array.isArray(value) || typeof value === 'object';
      }
    }
  }
</script>

<style scoped>
  .metadata-label {
    font-weight: bold;
    font-size: 1.1em;
  }
</style>
