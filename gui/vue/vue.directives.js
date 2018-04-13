const t = require('core/i18n/i18n.service').t;
const GlobalDirective = {
  install(Vue) {
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
        el.innerHTML = el.innerHTML + t(binding.value)
      }
    });
  }
};

module.exports = GlobalDirective;

