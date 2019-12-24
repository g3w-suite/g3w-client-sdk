const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const {XHR} = require('core/utils/utils');
const G3WObject = require('core/g3wobject');
const WPS_VERSION = "1.0.0";

function WPSProvider(options = {}) {
  base(this, options);
  this._name = 'wps';
  this._url = options.url;
  this._service = new WpsService({
    url: this._url,
    version: WPS_VERSION
  });
  this._inputs = [];
  this._outputs = [];
  this._parser = new X2JS();
}

inherit(WPSProvider, G3WObject);

const proto = WPSProvider.prototype;

proto._XMLToJSON = function(response) {
  return this._parser.xml2json(response);
};

proto._createProcessInputType = function(input) {
  const inputObject = {
    type: null,
    dataType: null,
    value: null,
    options: {}
  };
  if (input.complexData) {
    inputObject.type = 'file';
    inputObject.options.mimetype = input.complexData.formats[0].mimeType;
  } else if (input.literalData) {
    inputObject.type = input.literalData.literalDataDomains[0].dataType.type;
    inputObject.dataType = inputObject.type;
    inputObject.options = null;
  } else if (input.boundingBoxData) {
    inputObject.value = {
      llx: null,
      lly: null,
      upx: null,
      upy: null
    };
    inputObject.type = 'bbox';
    inputObject.epsg = input.boundingBoxData.supportedCRSs[0];
    inputObject.options.epsg = input.boundingBoxData.supportedCRSs;
  }
  return inputObject;
};

proto._buildFormFromDescribeProcessResponse = function({abstractValue, inputs, outputs}={}) {
  this._inputs = inputs;
  inputs = inputs.map((input) => {
    const inputType = this._createProcessInputType(input);
    return {
      id: input.identifier,
      label: input.title,
      ...inputType
    }
  });
  this._outputs = outputs;
  outputs = outputs.map((output)=> {
    return {
      id: output.identifier,
      label: output.title,
      sublabel: output.abstractValue || '',
      //dataType: output.complexData ? 'complexData' : 'literalData',
      //type: output.complexData ? output.complexData.formats: output.literalData && output.literalData.literalDataDomains[0].dataType.type,
      value: ''
    }
  });

  return {
    abstract: abstractValue,
    inputs,
    outputs
  }
};

proto.getCapabilities = function() {
  return new Promise((resolve, reject) => {
    this._service.getCapabilities_GET(response => {
      try {
        const processes = response.capabilities && response.capabilities.processes || [];
        resolve(processes);
      } catch (err) {
        reject(err);
      }
    });
  })
};

proto.describeProcess = function({id, format='form'}) {
  return new Promise((resolve, reject) =>{
    try {
      this._service.describeProcess_GET((response)=>{
        const describeProcessResponse = response.processOffering && response.processOffering.process;
        const describeProcessForm = this._buildFormFromDescribeProcessResponse(describeProcessResponse);
        resolve(describeProcessForm)
      }, id);
    } catch(err) {
      reject(err);
    }
  })
};

proto._createInputsForExcute = function(inputs=[]){
  return inputs.map(input => {
    let executeInput;
    const inputGenerator = new InputGenerator();
    const type = input.type;
    /**
     * the following parameters are mandatory: identifier and value
     *
     * the rest might be set to 'undefined'!
     *
     * @identifier input identifier
     * @dataType data type of the input; may be 'undefined'
     * @uom unit of measure; may be 'undefined'
     * @value the literal value of the input
     */
    switch(type) {
      case 'string':
      case 'float':
        executeInput = inputGenerator.createLiteralDataInput_wps_1_0_and_2_0(input.id, undefined, undefined, input.value);
        break;
      case 'file':
        executeInput = inputGenerator.createComplexDataInput_wps_1_0_and_2_0(input.id, input.options.mimetype, undefined, undefined, undefined, input.value);
        break;
      case 'bbox':
        const lowerCorner = `${input.value.llx} ${input.value.lly}`;
        const upperCorner = `${input.value.upx} ${input.value.upy}`;
        executeInput = inputGenerator.createBboxDataInput_wps_1_0_and_2_0(input.id, input.epsg, 2, lowerCorner, upperCorner);
        break;
    }
    return executeInput;
  })
};

proto._createOutputsForExcute = function(ouputs=[]) {
  return this._outputs.map((output, index) => {
    const outputGenerator = new OutputGenerator();
    /**
     * the following parameters are mandatory: identifier
     *
     * @identifier output identifier
     * @asReference boolean, "true" or "false"
     */
    if (output.literalData)
      return outputGenerator.createLiteralOutput_WPS_1_0(output.identifier, false);
    /**
     * the following parameters are mandatory: identifier
     *
     * the rest might be set to 'undefined'!
     *
     * @identifier output identifier
     * @mimeType MIME type of the input; may be 'undefined'
     * @schema reference to a schema; may be 'undefined'
     * @encoding encoding; may be 'undefined'
     * @uom unit of measure; may be 'undefined'
     * @asReference boolean, "true" or "false"
     * @title new title
     * @abstractValue new description as text of the 'Abstract' element
     *                of the response document
     */
    else if (output.complexData)
      return outputGenerator.createComplexOutput_WPS_1_0(output.identifier, output.complexData.formats[0].mimeType, output.complexData.formats[0].schema, output.complexData.formats[0].encoding, undefined, undefined, undefined, 'Pippo', 'Prova');
    else if (output.boundingBoxData){
      return outputGenerator.createComplexOutput_WPS_1_0(output.identifier);

    }
  })
};

proto.execute = function({inputs=[], id, outputs=[]} ={}) {
  const response_ = {
    status: 'ok',
    data: null,
    type: null
  };
  return new Promise((resolve, reject) =>{
    this._service.execute(response => {
      if (response.executeResponse) {
        //response.type is set to one of { responseDocument | resultDocument | statusInfoDocument | rawOutput }
        //response.responseDocument // property that stores the contents of response (structure depends on type!)
        /*
        * type 'rawOutput' stands for raw output
          type 'responseDocument' stands for a WPS 1.0.0 response document
          type 'resultDocument' stands for a WPS 2.0.0 result document (in response to a synchronous execution)
          type 'resultDocument' stands for a WPS 2.0.0 status info document (in response to an asynchronous execution)
        * */
        let data;
        const {type} = response.executeResponse;
        switch(type) {
          case 'responseDocument':
            data = this._parser.xml2json(response.responseDocument);
            if (data.ExecuteResponse.Status.ProcessFailed) {
              response_.status = "error";
              response_.data = data.ExecuteResponse.Status.ProcessFailed.ExceptionReport.Exception.ExceptionText.toString()
            } else {
              response_.data = response.responseDocument;
              response_.type = 'string';
            }
            resolve(response_);
            break;
          case "rawOutput":
            const responseType = this._outputs.find(output => output.complexData) ? 'vector' : 'string';
            data = response.executeResponse.responseDocument;
            response_.type = responseType;
            if (responseType === 'vector') {
              const parser = new ol.format.WMSGetFeatureInfo();
              const features = parser.readFeatures(data);
              response_.data = features;
            } else {
              response_.data = data;
            }
            resolve(response_);
            break;
          default:
        }
      }
    }, id, "raw", "sync", false, this._createInputsForExcute(inputs), this._createOutputsForExcute(this._outputs));
  })
};

proto._handleOutputProcessResponse = function(response) {
  const output = this._XMLToJSON(response);
  const response_ = {
    status: 'ok',
    data: null,
    type: null
  };
  const errorExceptionReport = output.ExceptionReport || (output.ExecuteResponse.Status.ProcessFailed && output.ExecuteResponse.Status.ProcessFailed.ExceptionReport);
  if (errorExceptionReport) {
    response_.status = 'error';
    response_.data = errorExceptionReport.Exception.ExceptionText.toString();
  } else if (output.ExecuteResponse) {
    if (output.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData) {
      const FeatureCollection = output.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.FeatureCollection;
      if (FeatureCollection.featureMember) FeatureCollection.featureMember = Array.isArray(FeatureCollection.featureMember) ? FeatureCollection.featureMember : [FeatureCollection.featureMember];
      const layerFeatureCollectionXML = this._parser.json2xml_str({
        FeatureCollection
      });
      const parser = new ol.format.WMSGetFeatureInfo();
      const features = parser.readFeatures(layerFeatureCollectionXML);
      response_.type = 'vector';
      response_.data = features;
    } else if(output.ExecuteResponse.ProcessOutputs.Output.Data.LiteralData) {
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
