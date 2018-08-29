<template>
  <table class="field_text_table">
    <td class="field_label">{{state.label}}</td>
    <td class="value"><span>{{ state.value }}</span></td>
  </table>
</template>

<script>
  export default {
    name: "text",
    props: ['state'],
    created() {
    }
  }
</script>

<style scoped>
  .field_text_table {
    background-color: transparent !important;
  }
  .field_text_table .field_label {
    font-weight: bold;
  }
</style>
