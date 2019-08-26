const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const {XHR, convertObjectToUrlParams} = require('core/utils/utils');
const G3WObject = require('core/g3wobject');

const FAKERESPONSE = {
  GetCapabilities: require('../../../test/data/providers/wps/getCapabilities.xml'),
  DescribeProcess: {
    'org.n52.wps.server.r.metMonthlyMeans': require('../../../test/data/providers/wps/org.n52.wps.server.r.metMonthlyMeans.xml'),
    'org.n52.wps.server.r.upperAirMonthlyMeans':require('../../../test/data/providers/wps/org.n52.wps.server.r.upperAirMonthlyMeans.xml')
  },
  Execute: {

  }
};

function WPSProvider(options = {}) {
  base(this, options);
  this._name = 'wps';
  this._url = options.url;
  this._parser = new X2JS();
}

inherit(WPSProvider, G3WObject);

const proto = WPSProvider.prototype;

proto._XMLToJSON = function(response) {
  return this._parser.xml_str2json(response);
};

proto._buildFromFromDescribeProcessResponse = function({Abstract, DataInputs, ProcessOutputs}={}) {
  let inputs = DataInputs.Input || [];
  let outputs =  ProcessOutputs.Output || [];
  inputs = inputs.map((input) => {
    return {
      id: input.Identifier.__text,
      label: input.Title.__text,
      type: input.LiteralData.DataType['_ows:reference'].split('xs:')[1],
      value: input.LiteralData.DefaultValue
    }
  });

  outputs = outputs.map((output)=> {
    console.log(output)
    return {
      id: output.Identifier.__text,
      label: output.Title.__text,
      type: 'string',
      value: ''
    }
  })

  return {
    abstract: Abstract.__text,
    inputs,
    outputs
  }
};

proto._getRequestParameters = function(REQUEST, {params={}}) {
  return {
    SERVICE: 'WPS',
    VERSION: '1.0.0',
    REQUEST,
    ...params
  }
};

proto.getCapabilities = async function() {
  const params = this._getRequestParameters('GetCapabilities', {});
  const url = `${this._url}?${convertObjectToUrlParams(params)}`;
  try {
    //const response = await XHR.get({url});
  } catch(err) {
    return
  }
  const response = FAKERESPONSE['GetCapabilities'];
  const getCapabilitiesResponseJSON = this._XMLToJSON(response);
  const processResponse = getCapabilitiesResponseJSON.Capabilities && getCapabilitiesResponseJSON.Capabilities.ProcessOfferings && getCapabilitiesResponseJSON.Capabilities.ProcessOfferings.Process || [];
  const process = [];
  processResponse.splice(0,2).forEach((theprocess) => {
    process.push({
      id: id = theprocess.Identifier.__text,
      name: theprocess.Title.__text
    })
  });
  return process;
};

proto.describeProcess = async function({id, format='form'}) {
  const params = this._getRequestParameters('DescribeProcess', {
    Identifier: id
  });
  const url = `${this._url}?${convertObjectToUrlParams(params)}`;
  const response = FAKERESPONSE['DescribeProcess'][id];
  const describeProcessJSON = this._XMLToJSON(response);
  const describeProcessResponse = describeProcessJSON.ProcessDescriptions && describeProcessJSON.ProcessDescriptions.ProcessDescription || {};
  const describeProcessForm = this._buildFromFromDescribeProcessResponse(describeProcessResponse);
  return describeProcessForm;
};

proto.execute = async function() {
  const response = await XHR.post(this._url, {});
};

proto.getStatus = function(jobId) {
  return XHR.get(this._url);
};

proto.getResult = function() {
  return;
};

module.exports = WPSProvider;
