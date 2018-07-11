<template>
  <div>
    <div :class="g3wtemplate.getColumnClass({width:'3'})" class="metadata-label">{{ data.label }}</div>
    <div :class="g3wtemplate.getColumnClass({width:'9'})" class="value" style="margin-top:0">
      <div v-for="(value, index) in data.value">
        <span class="bbox-labels">{{ bboxlabels[index] }}</span>  {{ value }}
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "metadatabbox",
    props: {
      data: {}
    },
    data() {
      return {
        bboxlabels: ['MINX', 'MINY', 'MAXX', 'MAXY']
      }
    }
  }
</script>

<style scoped>
  .metadata-label {
    font-weight: bold;
    font-size: 1.1em;
  }
  .bbox-labels {
    font-weight: bold;
  }
</style>
