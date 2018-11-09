<template>
  <div>
    <div v-if="tool.type == 'checkbox' " class="checkbox">
      <label>
        <input style="cursor:pointer"
          :id="tool.layerName"
          v-model="tool.isCheck"
          type="checkbox"
          :value="tool.layerName"
          @click="fireAction(tool)">
        {{ tool.name }}
      </label>
    </div>
    <div v-else class="tool" @click="fireAction(tool)">
      <i :class="g3wtemplate.getFontClass('caret-right')"></i>
      <span >{{ tool.name }}</span>
    </div>
  </div>
</template>

<script>
  export default {
    name: "g3w-tool",
    props: ['tool'],
    data() {
      return {}
    },
    methods: {
      fireAction() {
        this.tool.action()
      }
    }
  }
</script>

<style scoped>

</style>
