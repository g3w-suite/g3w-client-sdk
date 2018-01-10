function Expression() {
  this._expression = '';
}

const proto = Expression.prototype;

proto.and = function(field, value) {
    this._expression = this._expression ? this._expression + ' AND ': this._expression;
    if (field && value) {
      this.eq(field, value);
    }
    return this;
};

proto.or = function() {
  if (field && value) {
    this._expression = this._expression ? this._expression + ' OR ' : this._expression;
    this.eq(field, value);
  }
  return this;
};

proto.eq = function (field, value) {
  this._expression = this._expression + this._build('eq', field, value);
  return this;
};

proto.like = function(field, value) {
  this._expression = this._expression + this._build('LIKE', field, value);
  return this;
};

proto.ilike = function(field, value) {
  this._expression = this._expression + this._build('ILIKE', field, value);
  return this;
};

proto.not = function(field, value) {
  this._expression = this._expression + this._build('NOT', field, value);
  return this;
};

proto.gt = function(field, value) {
  this._expression = this._expression + this._build('gt', field, value);
  return this;
};

proto.gte = function(field, value) {
  this._expression = this._expression + this._build('gte', field, value);
  return this;
};

proto.lt = function(field, value) {
  this._expression = this._expression + this._build('lt', field, value);
  return this;
};

proto.lte = function(field, value) {
  this._expression = this._expression + this._build('lte', field, value);
  return this;
};

proto.clear = function() {
  this._expression = '';
  return this;
};

// metodo per il recupero dell'espressione
// chiamato da chi vuole ortriene il valore reale dell'espressione
proto.get = function() {
  return this._expression;
};

proto._build = function(operator, field, value) {
  return [field, Expression.OPERATORS[operator], value].join(' ')
};

proto.createExpressionFromFilter = function(filterObject, layername) {
  /////inserisco il nome del layer (typename) ///
  let filter = [];
  function createSingleFilter(booleanObject) {
    let filterElements = [];
    let filterElement = '';
    let valueExtra = "";
    let valueQuotes = "'";
    let rootFilter;
    _.forEach(booleanObject, function(v, k, obj) {
      //creo il filtro root che sarà AND OR
      rootFilter = Expression.OPERATORS[k];
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
            filterOp = Expression.OPERATORS[k];
            let value;
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
    this._expression = layername + ":" + createSingleFilter(filterObject);
    return this;
  } else {
    return this
  }
};


Expression.OPERATORS = {
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

module.exports = Expression;
