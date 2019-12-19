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

proto._buildFormFromDescribeProcessResponse = function({Abstract, DataInputs, ProcessOutputs}={}) {
  let inputs = DataInputs && DataInputs.Input  && (Array.isArray(DataInputs.Input) && DataInputs.Input || [DataInputs.Input])  || [];
  let outputs =  ProcessOutputs.Output && (Array.isArray(ProcessOutputs.Output) && ProcessOutputs.Output || [ProcessOutputs.Output])  || [];
  inputs = inputs.map((input) => {
    const inputType = this._createProcessInputType(input);
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
      type: output.LiteralOutput ? output.LiteralOutput.DataType.toString() : 'string',
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
  const describeProcessForm = this._buildFormFromDescribeProcessResponse(describeProcessResponse);
  return describeProcessForm;
};

proto._createXMLDataInputs = function(inputs) {
  inputs.forEach(input => {
    console.log(input)
  })
  let dataInputs = `<wps:DataInputs>\n
  
  </wps:DataInputs>`
};

proto._createXML_POST_Execute = function(inputs, id) {
  const version = '1.0.0';
  const xmlRequest = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n"
                        <wps:Execute service="WPS" version="${version}" 
                          xmlns:wps="http://www.opengis.net/wps/1.0.0"
                          xmlns:ows="http://www.opengis.net/ows/1.1" 
                          xmlns:xlink="http://www.w3.org/1999/xlink"
                          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                          xsi:schemaLocation="http://www.opengis.net/wps/1.0.0" 
                          http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd">"
                        <ows:Identifier>${id}</ows:Identifier>\n
                        </wps:Execute>
                        ${this._createXMLDataInputs(inputs)}\n  
                        </wps:Execute>`;
  console.log(xmlRequest)
};

proto.execute = async function({inputs=[], id} ={}) {
  const method = inputs.find(input => input.type === 'file') ? 'post' : 'get';
  const params = this._getRequestParameters('Execute', {
    IDENTIFIER: id,
  });
  params.DataInputs = inputs.map((input) =>{
    return `${input.id}=${input.value}`;
  }).join(';');
  const url = method === 'get' && `${this._url}?${convertObjectToUrlParams(params)}` || this._url;
  let response;
  try {
    this._createXML_POST_Execute(inputs, id);
    if (method === 'post')
      response = await XHR.post({
        url,
        contentType: "text/xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<wps:Execute service="WPS" version="1.0.0" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd"><ows:Identifier>Renerfor_CDP_Report_browser</ows:Identifier>\n<wps:DataInputs>\n<wps:Input>\n<ows:Identifier>vectorbacino</ows:Identifier>\n<ows:Title>vectorbacino</ows:Title>\n<wps:Data>\n<wps:ComplexData mimeType="text/xml" schema="" ><![CDATA[<ogr:FeatureCollection\n     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n     xsi:schemaLocation="/ "\n     xmlns:ogr="http://ogr.maptools.org/"\n     xmlns:gml="http://www.opengis.net/gml">\n  <gml:boundedBy>\n    <gml:Box>\n      <gml:coord><gml:X>374500</gml:X><gml:Y>4994500</gml:Y><gml:Z>0</gml:Z></gml:coord>\n      <gml:coord><gml:X>378500</gml:X><gml:Y>4999700</gml:Y><gml:Z>0</gml:Z></gml:coord>\n    </gml:Box>\n  </gml:boundedBy>\n                                                                                                          \n  <gml:featureMember>\n    <ogr:qt_temp fid="prova2.0">\n      <ogr:geometryProperty><gml:Polygon srsName="EPSG:32632"><gml:outerBoundaryIs><gml:LinearRing><gml:coordinates>376900,4994500,0 376800,4994500,0 376800,4994600,0 376700,4994600,0 376700,4994700,0 376400,4994700,0 376400,4994800,0 376300,4994800,0 376300,4994900,0 376000,4994900,0 376000,4994800,0 375900,4994800,0 375900,4994900,0 375800,4994900,0 375800,4994800,0 375600,4994800,0 375600,4995100,0 375100,4995100,0 375100,4995200,0 374900,4995200,0 374900,4995600,0 374500,4995600,0 374500,4996300,0 374600,4996300,0 374600,4996600,0 374700,4996600,0 374700,4996800,0 374800,4996800,0 374800,4996900,0 375000,4996900,0 375000,4997700,0 375100,4997700,0 375100,4997800,0 375200,4997800,0 375200,4998000,0 375300,4998000,0 375300,4998100,0 375400,4998100,0 375400,4998200,0 375500,4998200,0 375500,4998300,0 375400,4998300,0 375400,4998400,0 375300,4998400,0 375300,4998500,0 375200,4998500,0 375200,4998600,0 375300,4998600,0 375300,4999000,0 375400,4999000,0 375400,4999100,0 375500,4999100,0 375500,4999600,0 375600,4999600,0 375600,4999700,0 376100,4999700,0 376100,4999600,0 376300,4999600,0 376300,4999500,0 376500,4999500,0 376500,4999400,0 376700,4999400,0 376700,4999300,0 376800,4999300,0 376800,4999100,0 377000,4999100,0 377000,4998900,0 377200,4998900,0 377200,4998800,0 377400,4998800,0 377400,4998600,0 377600,4998600,0 377600,4998500,0 377800,4998500,0 377800,4998400,0 377900,4998400,0 377900,4998100,0 378000,4998100,0 378000,4998000,0 378100,4998000,0 378100,4997600,0 378300,4997600,0 378300,4997300,0 378400,4997300,0 378400,4997200,0 378500,4997200,0 378500,4997000,0 378400,4997000,0 378400,4996900,0 378300,4996900,0 378300,4996800,0 378200,4996800,0 378200,4996900,0 378000,4996900,0 378000,4996800,0 377800,4996800,0 377800,4996700,0 377700,4996700,0 377700,4996600,0 377500,4996600,0 377500,4996500,0 377400,4996500,0 377400,4996300,0 377300,4996300,0 377300,4996200,0 377200,4996200,0 377200,4995500,0 377000,4995500,0 377000,4995000,0 376900,4995000,0 376900,4994700,0 377000,4994700,0 377000,4994600,0 376900,4994600,0 376900,4994500,0</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon></ogr:geometryProperty>\n      <ogr:Name xsi:nil="true"/>\n      <ogr:descriptio xsi:nil="true"/>\n      <ogr:timestamp xsi:nil="true"/>\n      <ogr:begin xsi:nil="true"/>\n      <ogr:end xsi:nil="true"/>\n      <ogr:altitudeMo xsi:nil="true"/>\n      <ogr:tessellate>-1</ogr:tessellate>\n      <ogr:extrude>0</ogr:extrude>\n      <ogr:visibility>-1</ogr:visibility>\n      <ogr:drawOrder xsi:nil="true"/>\n      <ogr:icon xsi:nil="true"/>\n    </ogr:qt_temp>\n  </gml:featureMember>\n</ogr:FeatureCollection>]]></wps:ComplexData>\n</wps:Data>\n</wps:Input>\n<wps:Input>\n<ows:Identifier>namebacino</ows:Identifier>\n<ows:Title>namebacino</ows:Title>\n<wps:Data>\n<wps:LiteralData>hh</wps:LiteralData>\n</wps:Data>\n</wps:Input>\n</wps:DataInputs>\n<wps:ResponseForm>\n<wps:ResponseDocument lineage="false" storeExecuteResponse="false" status="false">\n<wps:Output>\n<ows:Identifier>textOut</ows:Identifier>\n</wps:Output>\n</wps:ResponseDocument>\n</wps:ResponseForm>\n</wps:Execute>'
      });
    else response = await XHR.get({url});
  } catch(error) {
    response = error.responseXML;
  }
  return this._handleOutputProcessResponse(response);
};

proto._handleOutputProcessResponse = function(response) {
  console.log(response)
  const output = this._XMLToJSON(response);
  console.log(output)
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
