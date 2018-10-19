// main object content for i18n
const plugins18nConfig = {
  it: {
    plugins: {}
  },
  en: {
    plugins: {}
  }
};

function init(config) {
  i18next
  .use(i18nextXHRBackend)
  .init({
      lng: config.lng,
      ns: 'app',
      fallbackLng: 'en',
      resources: config.resources
  });
  return new Promise((resolve, reject) => {
    jqueryI18next.init(i18next, $, {
      tName: 't', // --> appends $.t = i18next.t
      i18nName: 'i18n', // --> appends $.i18n = i18next
      handleName: 'localize', // --> appends $(selector).localize(opts);
      selectorAttr: 'data-i18n', // selector for translating elements
      targetAttr: 'data-i18n-target', // element attribute to grab target element to translate (if diffrent then itself)
      optionsAttr: 'data-i18n-options', // element attribute that contains options, will load/set if useOptionsAttr = true
      useOptionsAttr: false, // see optionsAttr
      parseDefaultValueFromContent: true // parses default values from content ele.val or ele.text
    });
    addI18n(plugins18nConfig);
    resolve();
  })

}

// function to translate
const t = function(text) {
    return i18next.t(text);
};

// function to translate plugins
const tPlugin = function(text) {
  return i18next.t(`plugins.${text}`);
};

const addI18nPlugin = function({name, config}) {
  for (const language in config) {
    plugins18nConfig[language].plugins[name] = config[language];
  }
  addI18n(plugins18nConfig);
};

const addI18n = function(i18nObject) {
  Object.entries(i18nObject).forEach(([lng, value]) => {
    Object.keys(value).forEach((key) => {
      i18next.addResource(lng, 'translation', key, value[key])
    })
  });
};

module.exports = {
  init,
  t,
  tPlugin,
  addI18n,
  addI18nPlugin
};
