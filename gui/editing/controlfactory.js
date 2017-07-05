var Layer = require('core/layers/layer');
var Geometry = require('core/geometry/geometry');
var Tool = require('./tool');
var EditingControl = require('./control');

var GeometryAddWorkflow = require('./workflows/geometryadd');
var GeometryModifyWorkflow = require('./workflows/geometrymodify');
var GeometryModifyVertexWorkflow = require('./workflows/geometrymodifyvertex');
var GeometryMoveWorkflow = require('./workflows/geometrymove');
var GeometryDeleteWorkflow = require('./workflows/geometrydelete');
var EditFeatureAttributesWorkflow = require('./workflows/editfeatureattributes');


function EditorControlFactory() {
  this.build = function(editor) {
    var layer = editor.getLayer();
    var layerType = layer.getLayerType();

    var tools = [];
    switch (layerType) {
      case Layer.LayerTypes.VECTOR:
        var geometryType = layer.getGeometryType();
        switch (geometryType) {
          case Geometry.GeometryTypes.POINT:
          case Geometry.GeometryTypes.MULTIPOINT:
            tools = [
              new Tool({
                id: 'point_addfeature',
                name: "Inserisci punto",
                icon: "addPoint.png",
                editor: editor,
                op: GeometryAddWorkflow
              }),
              new Tool({
                id: 'point_movefeature',
                name: "Modifica punto",
                icon: "movePoint.png",
                editor: editor,
                op: GeometryModifyWorkflow
              }),
              new Tool({
                id: 'point_deletefeature',
                name: "Elimina punto",
                icon: "deletePoint.png",
                editor: editor,
                op: GeometryDeleteWorkflow
              }),
              new Tool({
                id: 'point_editattributes',
                name: "Modifica attributi",
                icon: "editAttributes.png",
                editor: editor,
                op: EditFeatureAttributesWorkflow
              })
            ];
            break;
          case Geometry.GeometryTypes.LINESTRING:
          case Geometry.GeometryTypes.MULTILINESTRING:
            tools = [
              new Tool({
                id: 'line_addfeature',
                name: "Inserisci linea",
                icon: "addLine.png",
                editor: editor,
                op: GeometryAddWorkflow
              }),
              new Tool({
                id: 'line_movevertex',
                name: "Modifica vertice",
                icon: "moveVertex.png",
                editor: editor,
                op: GeometryModifyVertexWorkflow
              }),
              new Tool({
                id: 'line_deletefeature',
                name: "Elimina linea",
                icon: "deleteLine.png",
                editor: editor,
                op: GeometryDeleteWorkflow
              }),
              new Tool({
                id: 'line_editattributes',
                name: "Modifica attributi",
                icon: "editAttributes.png",
                editor: editor,
                op: EditFeatureAttributesWorkflow
              })
            ];
            break;
          case Geometry.GeometryTypes.POLYGON:
          case Geometry.GeometryTypes.MULTIPOLYGON:
            tools = [
              new Tool({
                id: 'polygon_addfeature',
                name: "Inserisci linea",
                icon: "AddPolygon.png",
                editor: editor,
                op: GeometryAddWorkflow
              }),
              new Tool({
                id: 'polygon_movefeature',
                name: "Inserisci linea",
                icon: "MovePolygon.png",
                editor: editor,
                op: GeometryMoveWorkflow
              }),
              new Tool({
                id: 'polygon_movevertex',
                name: "Modifica vertice",
                icon: "moveVertex.png",
                editor: editor,
                op: GeometryModifyVertexWorkflow
              }),
              new Tool({
                id: 'polygon_deletefeature',
                name: "Elimina linea",
                icon: "deleteLine.png",
                editor: editor,
                op: GeometryDeleteWorkflow
              }),
              new Tool({
                id: 'polygon_editattributes',
                name: "Modifica attributi",
                icon: "editAttributes.png",
                editor: editor,
                op: EditFeatureAttributesWorkflow
              })
            ];
            break;
        }
        break;
      case Layer.LayerTypes.TABLE:
        tools = [];
        break;
      default:
        tools = [];
        break;
    }

    return new EditingControl({
      editor: editor,
      tools: tools
    })
  };
}



module.exports = new EditorControlFactory;