<template>
  <div>
    <div :class="g3wtemplate.getColumnClass({width:'3'})" class="metadata-label">{{ data.label }}</div>
    <div :class="g3wtemplate.getColumnClass({width:'9'})" class="value" style="margin-top:0">
      <div v-for="(value, key) in data.value">
        <div :class="g3wtemplate.getRowClass()">
          <div :class="g3wtemplate.getColumnClass({width:'3'})" class="metadata-contact-label">
            <i class="fa contact-icon" :class="iconsClass[key]" aria-hidden="true"></i>
            <span v-t="'metadata.groups.general.fields.subfields.contactinformation.' + key"></span>
          </div>
          <div :class="g3wtemplate.getColumnClass({width:'9'})">
            <template v-if="key == 'personprimary'" >
              <div v-for="(subvalue, key) in value">
                <span v-t="'metadata.groups.general.fields.subfields.contactinformation.' + key" class="metadata-contact-label"></span>
                <span>{{ subvalue }}</span>
              </div>
            </template>
            <div v-else>
              {{ sanitizeValue(value) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "metadatacontatcs",
    props: {
      data: {}
    },
    data() {
      return {
        iconsClass: {
          contactelectronicmailaddress: "fa-envelope-o",
          personprimary: "fa-user",
          contactvoicetelephone: "fa-mobile"
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
        return value;
      },
      geti18n(key) {

      }
    }
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
