<template>
  <div>
    <div class="col-sm-3 metadata-label">{{ data.label }}</div>
    <div class="col-sm-9 value" style="margin-top:0">
      <div v-for="(value, key) in data.value">
        <div v-if="key != 'personprimary'">
          <span class="metadata-contact-label">
            <i class="fa contact-icon" :class="iconsClass[key]" aria-hidden="true"></i>
            {{ labels[key]}}
          </span>
          <span>
            {{ sanitizeValue(value) }}
          </span>
        </div>
        <div v-else class="row">
          <div class="col-sm-3 metadata-contact-label">
            <i class="fa contact-icon" :class="iconsClass[key]" aria-hidden="true"></i>
            {{ labels[key]}}
          </div>
          <div class="col-sm-7">
            <div v-for="(value, key) in value">
              <span class="metadata-contact-label" >{{ labels[key]}}</span>
              <span>{{ value }}</span>
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
        labels: {
          contactelectronicmailaddress: "email",
          personprimary: 'Persona di riferimento',
          contactvoicetelephone: 'Telefono',
          contactorganization: 'Organizzazione',
          contactposition: 'Posizione',
          contactperson: 'Persona'
        },
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
</style>
