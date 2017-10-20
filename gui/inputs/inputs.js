// rappresenta l'oggetto ponte per raccogliere
// tutti i tipi di inputs. Mi serve per evitare di chiamare
// tutte le volte nel require tutto il percorso

var InputsComponents = {
  'text_input': require('./text/vue/text'),
  'textarea_input': require('./textarea/vue/textarea'),
  'integer_input': require('./integer/vue/integer'),
  'string_input':require('./text/vue/text'), //temporaneo
  'float_input': require('./integer/vue/integer'), // temporaneo,
  'radio_input': require('./radio/vue/radio'),
  'check_input': require('./checkbox/vue/checkbox'),
  'range_input': require('./range/vue/range'),
  'datetimepicker_input': require('./datetimepicker/vue/datetimepicker'),
  'unique_input': require('./unique/vue/unique'),
  'select_input': require('./select/vue/select')
};

module.exports = InputsComponents;