const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const {XHR, convertObjectToUrlParams} = require('core/utils/utils');
const G3WObject = require('core/g3wobject');

function WPSProvider(options = {}) {
  base(this, options);
  this._name = 'wps';
  this._url = options.url;
  this._parser = new X2JS();
}

inherit(WPSProvider, G3WObject);

const proto = WPSProvider.prototype;

proto._XMLToJSON = function(response) {
  return this._parser.xml2json(response);
};

proto._createProcessInputType = function(input) {
  console.log(input)
  const typeValue = {
    type: null,
    value: null,
    options: {}
  };
  if (input.ComplexData) {
    typeValue.type = 'file';
    typeValue.options.mimetype = input.ComplexData.Default.Format.MimeType;
  } else if (input.LiteralData) {
    typeValue.type = input.LiteralData.DataType.toString()
  } else if (input.BoundingBoxData) {
    typeValue.type = 'bbox';
    typeValue.value = input.BoundingBoxData.Default.CRS;
    typeValue.options.epsg = input.BoundingBoxData.Supported.CRS || [input.BoundingBoxData.Default.CRS]
  }
  return typeValue;
};

proto._buildFromFromDescribeProcessResponse = function({Abstract, DataInputs, ProcessOutputs}={}) {
  let inputs = DataInputs.Input  && (Array.isArray(DataInputs.Input) && DataInputs.Input || [DataInputs.Input])  || [];
  let outputs =  ProcessOutputs.Output && (Array.isArray(ProcessOutputs.Output) && ProcessOutputs.Output || [ProcessOutputs.Output])  || [];
  inputs = inputs.map((input) => {
    const inputType = this._createProcessInputType(input);
    console.log(inputType)
    return {
      id: input.Identifier.toString(),
      label: input.Title.toString(),
      ...inputType
    }
  });

  outputs = outputs.map((output)=> {
    return {
      id: output.Identifier.toString(),
      label: output.Title.toString(),
      sublabel: output.ComplexOutput && output.ComplexOutput.Default && output.ComplexOutput.Default.Format || '',
      type: 'string',
      value: ''
    }
  });

  return {
    abstract: Abstract.toString(),
    inputs,
    outputs
  }
};

proto._getRequestParameters = function(REQUEST, params={}) {
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
  const process = [];
  try {
    const response = await XHR.get({url});
    const getCapabilitiesResponseJSON = this._XMLToJSON(response);
    const processResponse = getCapabilitiesResponseJSON.Capabilities && getCapabilitiesResponseJSON.Capabilities.ProcessOfferings && getCapabilitiesResponseJSON.Capabilities.ProcessOfferings.Process || [];
    processResponse.forEach((theprocess) => {
      process.push({
        id: id = theprocess.Identifier.toString(),
        name: theprocess.Title.toString()
      });
    });
  } catch(err) {}
  return process;
};

proto.describeProcess = async function({id, format='form'}) {
  const params = this._getRequestParameters('DescribeProcess', {
    Identifier: id
  });
  const url = `${this._url}?${convertObjectToUrlParams(params)}`;
  const response  = await XHR.get({url});
  const describeProcessJSON = this._XMLToJSON(response);
  const describeProcessResponse = describeProcessJSON.ProcessDescriptions && describeProcessJSON.ProcessDescriptions.ProcessDescription || {};
  const describeProcessForm = this._buildFromFromDescribeProcessResponse(describeProcessResponse);
  return describeProcessForm;
};

proto.execute = async function({inputs=[], id } ={}) {
  const params = this._getRequestParameters('Execute', {
    IDENTIFIER: id,
  });
  params.DataInputs = inputs.map((input) =>{
    return `${input.id}=${input.value}`;
  }).join(';');
  const url = `${this._url}?${convertObjectToUrlParams(params)}`;
  const response = await XHR.get({url});
  return this._handleOutputProcessResponse(response);
};

proto._handleOutputProcessResponse = function(response) {
  const output = this._XMLToJSON(response);
  const response_ = {
    status: 'ok',
    data: null,
    type: null
  };
  if (output.ExecuteResponse.Status.ProcessFailed) {
    response_.status = 'error';
    response_.data = output.ExecuteResponse.Status.ProcessFailed.ExceptionReport.Exception.ExceptionText.toString()
  } else {
    if (output.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData) {
      const FeatureCollection = output.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.FeatureCollection;
      if (FeatureCollection.featureMember)
        FeatureCollection.featureMember = Array.isArray(FeatureCollection.featureMember) ? FeatureCollection.featureMember : [FeatureCollection.featureMember];
      const layerFeatureCollectionXML = this._parser.json2xml_str({
        FeatureCollection
      });
      const parser = new ol.format.WMSGetFeatureInfo();
      const features = parser.readFeatures(layerFeatureCollectionXML);
      response.type = 'vector';
      response.data = features;
    } else if (output.ExecuteResponse.ProcessOutputs.Output.Data.LiteralData) {
      response_.type = output.ExecuteResponse.ProcessOutputs.Output.Data.LiteralData._dataType;
      response_.data = output.ExecuteResponse.ProcessOutputs.Output.Data.LiteralData.toString();
    }
  }
  return response_;
};

proto.getStatus = function(jobId) {
  return XHR.get(this._url);
};

proto.getResult = function() {
  return;
};

module.exports = WPSProvider;
