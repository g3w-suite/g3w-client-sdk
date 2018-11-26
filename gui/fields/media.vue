<template>
  <div class="preview" >
    <a :href="value" target="_blank">
      <div class="previewtype" :class="type">
        <i class="fa-2x" :class="g3wtemplate.font[type]"></i>
      </div>
    </a>
    <div class="filename">{{ filename }}</div>
  </div>
</template>

<script>
  const MediaMixin = require('gui/vue/vue.mixins').mediaMixin;
  export default {
    name: "g3w-media",
    mixins: [MediaMixin],
    props: ['state'],
    computed: {
      type() {
        return this.getMediaType(this.state.mime_type).type;
      },
      value() {
        return this.state.value
      }
    }
  }
</script>

<style scoped>

</style>
