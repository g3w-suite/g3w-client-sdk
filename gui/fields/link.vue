<template>
  <field :state="state">
    <button slot="field" class="btn btn-info field_link" v-t="'info.link_button'" @click="openLink(value)"></button>
  </field>
</template>

<script>
  import Field from './field.vue';
  export default {
    name: "link",
    props: ['state'],
    data() {
      return {
        value:null
      }
    },
    components: {
      Field
    },
    methods: {
      openLink: function(link_url) {
        window.open(link_url, '_blank');
      }
    },
    created() {
      if (this.state.value && typeof  this.state.value === 'object' && this.state.value.constructor === Object) {
        this.value = this.state.value.value;
      } else {
        this.value = this.state.value
      }
    }
  }
</script>

<style scoped>
  .field_link {
    width: 100%;
    padding: 2px;
  }
</style>
