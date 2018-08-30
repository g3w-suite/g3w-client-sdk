<template>
  <field :state="state">
    <div class="container-fluid" slot="field">
      <div  class="row">
        <div v-for="(value, index) in values" class="col-sm-12 image">
          <img class="img-responsive" @click="showGallery(index)" :src="getSrc(value)"/>
        </div>
      </div>
      <gallery :id="galleryId" :active="active" :images="getGalleryImages()"></gallery>
    </div>
  </field>
</template>

<script>
  import Field from './field.vue';
  import Gallery from './gallery.vue'
  export default {
    name: "image",
    props: ['state'],
    data() {
      return {
        galleryId: 'gallery_' + Date.now(),
        active: null,
        value: this.state.value
      }
    },
    components: {
      Gallery,
      Field
    },
    computed: {
      values() {
        return Array.isArray(this.value) ? this.value : [this.value];
      }
    },
    methods: {
      getSrc(value) {
        if (typeof value == 'object') {
          return value.photo;
        }
        return value
      },
      showGallery(index) {
        this.active = index;
        if (typeof this.value == 'object') {
          this.value.active = true;
        }
        $('#'+this.galleryId).modal('show');
      },
      getGalleryImages() {
        const images = [];
        this.values.forEach((image) => {
          images.push({
            src: this.getSrc(image)
          })
        });
        return images
      }
    },
    created() {}
  }
</script>

<style scoped>
  .img-responsive {
    cursor: pointer;
  }

</style>
