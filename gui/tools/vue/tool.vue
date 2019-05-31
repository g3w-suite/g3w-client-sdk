<template>
  <div>
    <div v-if="tool.type === 'checkbox' " class="checkbox">
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
    <div v-else class="tool" @click="!disabled ? fireAction(tool) : null" :class="{tool_disabled: disabled}">
      <bar-loader :loading="tool.loading"></bar-loader>
      <i :class="g3wtemplate.getFontClass(icon)"></i>
      <span v-if="tool.html" >
        <i :class="tool.html.icon"></i>
        {{ tool.html.text || tool.name}}
      </span>
      <span v-else>{{ tool.name }}</span>
    </div>
  </div>
</template>

<script>
  export default {
    name: "g3w-tool",
    props: {
      tool: {
        required: true
      }
    },
    data() {
      return {}
    },
    methods: {
      fireAction(tool) {
        this.tool.action(tool);
      }
    },
    computed: {
      disabled() {
        return this.tool.loading || this.tool.disabled;
      },
      icon() {
        return this.tool.icon || 'caret-right'
      }
    }
  }

</script>

<style scoped>
  .tool_disabled {
    cursor: not-allowed;
  }

  .tool_disabled > span {
    color: #777;
  }
</style>
