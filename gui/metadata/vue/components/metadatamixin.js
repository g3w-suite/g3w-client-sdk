const LinkPattern = /^(http(s)?:\/\/)/g;
const isString = (value) => {
  return typeof value === 'string'
};
export default {
  methods: {
    findAttributeFormMetadataAttribute(name) {
      return this.state.metadata ? this.state.metadata[name] !== undefined : false;
    },
    findMetadataAttribute(name) {
      return this.state[name] !== undefined;
    },
    isLink(value) {
      return isString(value) && value.match(LinkPattern);
    },
    setNewLine(value) {
      const split = isString(value) && value.split('|') || [];
      if (split.length > 1) {
        value = split.join('<br>')
      }
      return value;
    }
  }
}
