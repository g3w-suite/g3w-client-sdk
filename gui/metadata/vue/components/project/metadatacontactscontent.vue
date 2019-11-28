<template>
  <div>
    <div class="col-sm-3 metadata-label">{{ data.label }}</div>
    <div class="col-sm-9 value" style="margin-top:0">
      <div v-for="(value, key) in data.value" :key="key">
        <div class="row">
          <div class="col-sm-3 metadata-contact-label">
            <i class="contact-icon" :class="iconsClass[key]" aria-hidden="true"></i>
            <span v-t="'sdk.metadata.groups.general.fields.subfields.contactinformation.' + key"></span>
          </div>
          <div class="col-sm-9">
            <template v-if="key === 'personprimary'">
              <div v-for="(subvalue, key) in value" :key="key">
                <div class="col-sm-3">
                  <span v-t="'sdk.metadata.groups.general.fields.subfields.contactinformation.' + key" class="metadata-contact-label"></span>
                </div>
                <div class="col-sm-9">
                  <a :href="subvalue" target="_blank" v-if="isLink(subvalue)">{{ subvalue }}</a>
                  <span v-else v-html="sanitizeValue(subvalue)"></span>
                </div>
              </div>
            </template>
            <div v-else class="col-sm-12">
              <template v-if="key === 'contactelectronicmailaddress'">
                <a :href="'mailto:' + sanitizeValue(value)">{{ sanitizeValue(value)}} </a>
              </template>
              <template v-else>
                <a :href="subvalue" target="_blank" v-if="isLink(value)">{{ value }}</a>
                <span v-else v-html="sanitizeValue(value)"></span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import MetadataMixin from '../metadatamixin';
  export default {
    name: "metadatacontatcs",
    mixins: [MetadataMixin],
    props: {
      data: {}
    },
    data() {
      return {
        iconsClass: {
          contactelectronicmailaddress: this.g3wtemplate.getFontClass("mail"),
          personprimary: this.g3wtemplate.getFontClass("user"),
          contactvoicetelephone: this.g3wtemplate.getFontClass("mobile")
        }
      }
    },
    methods: {
      sanitizeValue(value) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            value = Object.keys(value).length ? value : '';
          } else if (Array.isArray(value)) {
            value = value.length ? value : '';
          }
        }
        return this.setNewLine(value);
      }
    },
  }
</script>

<style scoped>
  .metadata-label {
    font-weight: bold;
    font-size: 1.1em;
  }
  .metadata-contact-label {
    font-weight: bold;
  }
  .contact-icon {
    margin-right: 3px;
  }
  .row {
    margin-bottom: 5px;
  }
</style>
