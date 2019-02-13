<template>
  <div class="field">
    <div v-if="state.label" class="col-sm-6  field_label">
      <slot name="label">{{state.label}}</slot>
    </div>
    <div :class="[state.label ? 'col-sm-6' : null ]" class="field_value">
      <slot name="field">
        <span style="word-wrap: break-word;">{{ state.value }}</span>
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
  .value {
    position: relative;
  }
  .field div {
    padding-left: 5px;
    padding-right: 5px;
  }
</style>
