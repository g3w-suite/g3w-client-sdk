<template>
  <div class="modal fade modal-fullscreen force-fullscreen" :id="id" tabindex="-1" role="dialog" aria-labelledby="" aria-hidden="true" >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body">
          <!--begin carousel-->
          <div :id="carouselId" class="carousel slide" data-interval="false">
            <div class="carousel-inner">
              <div v-for="(image, index) in images" class="item" :class="active == index ? 'active' : ''">
                <img :src="image.src">
              </div>
            </div>
            <a v-if="images.length > 1" class="left carousel-control" :href="'#'+carouselId" role="button" data-slide="prev">
              <span class="glyphicon glyphicon-chevron-left">

              </span>
            </a>
            <a v-if="images.length > 1" class="right carousel-control" :href="'#'+carouselId" role="button" data-slide="next">
              <span class="glyphicon glyphicon-chevron-right">
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "gallery",
    props: {
      images: {
        type: Array,
        default: []
      },
      id: {
        type: String,
        default: 'gallery'
      },
      active: {
        type: Number
      }
    },
    data() {
      return {
        carouselId: 'carousel_'+ Date.now()
      }
    },
    methods: {
      isActive(src) {
        return src === active
      }
    }
  }
</script>

<style scoped>
  .modal-dialog {
    display: inline-block;
    text-align: left;
    vertical-align: middle;
  }
  .modal {
    text-align: center;
    padding: 0!important;
  }

  .modal:before {
    content: '';
    display: inline-block;
    height: 100%;
    vertical-align: middle;
    margin-right: -4px;
  }
</style>
