import Text from './text.vue';
import Link from './link.vue';
import Image from './image.vue'
import Geo from './geo.vue';
const Fields = {
  simple_field: Text,
  text_field: Text,
  link_field: Link,
  image_field: Image,
  geo_field: Geo,
  photo_field: Image
};

module.exports = Fields;
