<template>
  <component
    :is="type"
    :state="state">
  </component>
</template>

<script>
  const Inputs = require('./inputs');
  export default {
    name: "g3w-input",
    props: {
      state: {
        required: true
      }
    },
    components: {
      ...Inputs
    },
    computed: {
      type() {
        return `${this.state.input.type}_input`;
      }
    }
  }
</script>

<style scoped>

</style>
