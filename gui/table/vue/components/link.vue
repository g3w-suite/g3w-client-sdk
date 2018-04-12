<template>
  <a :href="href" target="_blank">
    <i class="glyphicon glyphicon-link"></i>
  </a>
</template>

<script>
  export default {
    name: "link",
    props: ['href']
  }
</script>

<style scoped>

</style>
