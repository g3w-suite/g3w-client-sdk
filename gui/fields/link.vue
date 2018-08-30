<template>
  <field :state="state">
    <button slot="field" class="btn btn-info field_link" v-t="'info.link_button'" @click="openLink(state.value)"></button>
  </field>
</template>

<script>
  import Field from './field.vue';
  export default {
    name: "link",
    props: ['state'],
    components: {
      Field
    },
    methods: {
      openLink: function(link_url) {
        window.open(link_url, '_blank');
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
