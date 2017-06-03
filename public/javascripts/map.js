var layerTree =  function(options){
  'use strict';
  if(!(this instanceof layerTree)){
      throw new Error('layerTree must be constructed with the new keyword');
  } else if (typeof options === 'object' && options.map && options.target){
      if(!(options.map) instanceof ol.Map){
          throw new Error('Please provide a valid OpenLayers 4 map object');
      }
      this.map = options.map;
      var containerDiv = document.getElementById(options.target);
      if(containerDiv === null || containerDiv.nodeType !== 1) {
          throw new Error('Please provide a valid element id.');
      }
      this.layerContainer = document.createElement('div');
      this.layerContainer.className = 'panel-body list-group';
      containerDiv.appendChild(this.layerContainer);
      var idCounter = 0;
      this.createRegistry = function(layer){
          layer.set('id', 'layer_' + idCounter);
          idCounter += 1;
          var layer_label = document.createElement('label');
          layer_label.className = 'list-group-item checkbox-inline';
          // Lägg till input, a, div
          // Fixa event listener...
      }
  } else {
      throw new Error('Invalid parameter(s) provided.');
  }
};
function init(){
    document.removeEventListener('DOMContentLoaded', init);
    var map = new ol.Map({
        target: "map",
        layers: [
            new ol.layer.Tile({
                visible: true,
                source: new ol.source.BingMaps({
                    key: 'Aj0LLnXkcQViB8dmKhWrqiVDbhKqJUE3-ROu6f6NKQbL73li6F_Ob7aHEyMCBmcw',
                    imagerySet: 'Aerial'
                }),
                name: 'BingMapsAerial',
                alias: 'Flygbilder'
            }),
            new ol.layer.Tile({
                visible: true,
                source: new ol.source.OSM(),
                name: 'OpenStreetMap',
                alias: 'Karta'
            })
        ],
        view: new ol.View({
            center: [1908533.467, 8551296.993],
            zoom: 11
        })
    });
    // Target kanske borde ändras på något sätt...
    var tree = new layerTree({map: map, target: 'layers'});
}
