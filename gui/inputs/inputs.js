// rappresenta l'oggetto ponte per raccogliere
// tutti i tipi di inputs. Mi serve per evitare di chiamare
// tutte le volte nel require tutto il percorso

var InputsComponents = {
  'text_input': require('./text/vue/text'),
  'textarea_input': require('./textarea/vue/textarea'),
  'integer_input': require('./integer/vue/integer'),
  'string_input':require('./text/vue/text'), //temporaneo
  'float_input': require('./integer/vue/integer') // temporaneo
};

module.exports = InputsComponents;