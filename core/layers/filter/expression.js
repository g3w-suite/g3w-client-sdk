var Filters = {
  eq: '=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '=<',
  LIKE: 'LIKE',
  ILIKE: 'ILIKE',
  AND: 'AND',
  OR: 'OR',
  NOT: '!='
};

function Expression(options) {
  options = options || {};
}

var proto = Expression.prototype;

proto._createFilter = function(filterObject, layername) {
  /////inserisco il nome del layer (typename) ///
  var filter = [];
  function createSingleFilter(booleanObject) {
    var filterElements = [];
    var filterElement = '';
    var valueExtra = "";
    var valueQuotes = "'";
    var rootFilter;
    _.forEach(booleanObject, function(v, k, obj) {
      //creo il filtro root che sarà AND OR
      rootFilter = Filters[k];
      //qui c'è array degli elementi di un booleano
      _.forEach(v, function(input){
        //scorro su oggetto
        valueExtra = "";
        _.forEach(input, function(v, k, obj) {
          //verifico se il valore dell'oggetto è array e quindi è altro oggetto padre booleano
          if (_.isArray(v)) {
            filterElement = createSingleFilter(obj);
          } else { // è un oggetto operatore
            if (k == 'LIKE' || k == 'ILIKE') {
              valueExtra = "%";
            }
            filterOp = Filters[k];
            var value;
            _.forEach(input, function(v, k, obj) {
              _.forEach(v, function(v, k, obj) {
                //verifico se il valore non è un numero e quindi aggiungo singolo apice
                if (!(_.isNull(v) || (_.isNaN(v) || _.trim(v) == ''))) {
                  filterElement = "\"" + k + "\" "+ filterOp +" " + valueQuotes + valueExtra + v + valueExtra + valueQuotes;
                  filterElements.push(filterElement);
                }
              });
            });
          }
        });
      });
      rootFilter = (filterElements.length > 0) ? filterElements.join(" "+ rootFilter + " ") : false;
    });
    return rootFilter;
  }
  //assegno il filtro creato
  if (createSingleFilter(filterObject)) {
    return  layername + ":" + createSingleFilter(filterObject);
  } else {
    return false
  }
};


module.exports = Expression;