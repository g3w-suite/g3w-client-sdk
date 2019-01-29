<template>
  <form class="form-horizontal g3w-form">
    <div class="box-primary">
      <div class="box-body">
          <template v-for="field in state.fields">
            <component v-if="field.type !== 'child'"
              @changeinput="changeInput"
              @addinput="addToValidate"
              :addToValidate="addToValidate"
              :changeInput="changeInput"
              :state="field"
              :is="field.type === 'child' ? `${field.type}` : `${field.input.type}_input`">
            </component>
            <span v-if="field.type !== 'child'" class="divider"></span>
            <div v-else style="border-top: 2px solid" class="skin-border-color">
              <h4 style="font-weight: bold">{{ field.label}}</h4>
              <div> {{ field.description }} </div>
              <g3w-form-inputs
                :state="field"
                @changeinput="changeInput"
                @addinput="addToValidate"
                :addToValidate="addToValidate"
                :changeInput="changeInput">
              </g3w-form-inputs>
            </div>
          </template>
      </div>
    </div>
  </form>
</template>

<script>
  const Inputs = require('gui/inputs/inputs');
  export default {
    name: "g3w-form-inputs",
    props:['state', 'addToValidate', 'changeInput'],
    components: {
      ...Inputs
    }
  }
</script>

<style scoped>

</style>
