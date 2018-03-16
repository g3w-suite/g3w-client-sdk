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

// get expression method to get the realt value of the expression
proto.get = function() {
  return this._expression;
};

proto._build = function(operator, field, value) {
  return [field, Expression.OPERATORS[operator], value].join(' ')
};

proto.createExpressionFromFilter = function(filterObject, layername) {
  /////insert (typename) ///
  let filter = [];
  function createSingleFilter(booleanObject) {
    let filterElements = [];
    let filterElement = '';
    let valueExtra = "";
    let valueQuotes = "'";
    let rootFilter;
    _.forEach(booleanObject, function(v, k, obj) {
      //root filter AND or OR
      rootFilter = Expression.OPERATORS[k];
      //boolean array
      _.forEach(v, function(input){
        //loop on the obejct
        valueExtra = "";
        _.forEach(input, function(v, k, obj) {
          if (_.isArray(v)) {
            filterElement = createSingleFilter(obj);
          } else {
            if (k == 'LIKE' || k == 'ILIKE') {
              valueExtra = "%";
            }
            filterOp = Expression.OPERATORS[k];
            let value;
            _.forEach(input, function(v, k, obj) {
              _.forEach(v, function(v, k, obj) {
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
