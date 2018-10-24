const t = require('core/i18n/i18n.service').t;
const tTemplate = require('core/i18n/i18n.service').tTemplate;
const GlobalDirective = {
  install(Vue) {
    const prePositioni18n = ({el, binding, i18nFnc = t }) => {
      const position = binding.arg ? binding.arg : 'post';
      if (position === 'pre')
        el.innerHTML = i18nFnc(binding.value) + el.innerHTML;
      else if (position === 'post')
        el.innerHTML = el.innerHTML + i18nFnc(binding.value);
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
        if (binding.value==0){
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
  }
};

module.exports = GlobalDirective;

