import ApplicationState from 'core/applicationstate';
const {t, tTemplate, tPlugin, changeLanguage} = require('core/i18n/i18n.service')
const GlobalDirective = {
  install(Vue) {
    const vm = new Vue();
    const prePositioni18n = ({el, binding, i18nFnc = t }) => {
      const innerHTML = el.innerHTML;
      const position = binding.arg ? binding.arg : 'post';
      const handlerElement = (innerHTML)=>{
        if (position === 'pre') el.innerHTML = i18nFnc(binding.value) + innerHTML;
        else if (position === 'post') el.innerHTML = innerHTML + i18nFnc(binding.value);
      };
      vm.$watch(() => ApplicationState.lng, (lng) => {
          changeLanguage(lng);
          handlerElement(innerHTML);
        }
      );
      handlerElement(innerHTML);
    };

    Vue.directive("disabled",function(el, binding){
        if (binding.value){
          el.setAttribute('disabled','disabled');
        } else {
          el.removeAttribute('disabled');
        }
      }
    );

    Vue.directive("checked",function(el, binding){
        if (binding.value){
          el.setAttribute('checked','checked');
        } else {
          el.removeAttribute('checked');
        }
      }
    );

    Vue.directive("selected-first",function(el, binding){
        if (binding.value===0){
          el.setAttribute('selected','');
        } else {
          el.removeAttribute('selected');
        }
      }
    );

    Vue.directive("t", {
      bind: function (el, binding) {
        prePositioni18n({
          el,
          binding,
          i18nFnc: t
        })
      }
    });

    Vue.directive("t-template", {
      bind: function (el, binding) {
        prePositioni18n({
          el,
          binding,
          i18nFnc: tTemplate
        })
      }
    });

    Vue.directive("t-plugin", {
      bind: function (el, binding) {
        prePositioni18n({
          el,
          binding,
          i18nFnc: tPlugin
        })
      }
    });
  }
};

module.exports = GlobalDirective;

