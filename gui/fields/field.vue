<template>
  <div class="col-sm-12 field">
    <div class="col-md-6 col-sm-12 field_label">{{state.label}}</div>
    <div class="value col-md-6 col-sm-12 ">
      <slot name="field">
        <span>{{ state.value }}</span>
      </slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: "field",
    props: ['state']
  }
</script>

<style scoped>
  .field {
    background-color: transparent !important;
    min-height: 30px;
  }
  .field .field_label {
    font-weight: bold;
  }
  .value {
    position: relative;
  }
  .field div {
    padding-left: 5px;
    padding-right: 5px;
  }
</style>
