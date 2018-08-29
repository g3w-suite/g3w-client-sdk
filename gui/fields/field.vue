<template>
  <table class="field_text_table">
    <td class="field_label">{{state.label}}</td>
    <td class="value">
      <slot name="field">
        <span>{{ state.value }}</span>
      </slot>
    </td>
  </table>
</template>

<script>
  export default {
    name: "field",
    props: ['state']
  }
</script>

<style scoped>
  .field_text_table {
    background-color: transparent !important;
  }
  .field_text_table .field_label {
    font-weight: bold;
  }
  .value {
    position: relative;
  }
</style>
