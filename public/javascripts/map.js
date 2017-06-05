
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
      this.createRegistry = function(layer){
          var layer_label = document.createElement('label');
          layer_label.className = 'list-group-item checkbox-inline';
          var layer_checkbox = document.createElement('input');
          layer_checkbox.className = layer.get('name')+'_checkbox';
          layer_checkbox.setAttribute('type', 'checkbox');
          layer_checkbox.checked = layer.getVisible();
          layer_checkbox.addEventListener('change', function(){
              if(this.checked){
                  layer.setVisible(true);
              } else {
                  layer.setVisible(false);
              }
          });
          var layer_link = document.createElement('a');
          layer_link.setAttribute('href', '#');
          layer_link.setAttribute('data-toggle', 'collapse');
          layer_link.setAttribute('data-target', '#'+layer.get('name')+'_content');
          var layer_icon = document.createElement('i');
          layer_icon.className = 'fa';
          layer_icon.className += ' fa-'+layer.get('iconName');
          layer_icon.className +=' fa-lg btn-large';
          layer_icon.innerHTML = '&nbsp;'+layer.get('alias');
          layer_link.appendChild(layer_icon);
          var layer_content = document.createElement('div');
          layer_content.className = 'collapse';
          layer_content.setAttribute('id', layer.get('name')+'_content');
          layer_content.innerHTML = '<br>';
          var layer_range = document.createElement('input');
          layer_range.className = layer.get('name')+'_range';
          layer_range.setAttribute('type', 'range');
          layer_range.setAttribute('min', '0');
          layer_range.setAttribute('max', '1');
          layer_range.setAttribute('step', '0.01');
          var range_txt = document.createElement('h4');
          range_txt.innerHTML = 'Transparans: 100%';

          layer_range.addEventListener('input', function(){
              layer.setOpacity(this.value);
              range_txt.innerHTML = 'Transparans: '+Math.floor(this.value*100)+'%';
          });
          layer_range.addEventListener('change', function(){
              layer.setOpacity(this.value);
              range_txt.innerHTML = 'Transparans: '+Math.floor(this.value*100)+'%';
          });

          layer_content.appendChild(range_txt);
          layer_content.appendChild(layer_range);
          layer_label.appendChild(layer_checkbox);
          layer_label.appendChild(layer_link);
          layer_label.appendChild(layer_content);
          this.layerContainer.insertBefore(layer_label, this.layerContainer.firstChild);
          return this;
      };
  } else {
      throw new Error('Invalid parameter(s) provided.');
  }
};
layerTree.prototype.showErrorMsg = function(txt){
    document.getElementById('em_model_body').innerHTML += txt;
    $('#em_model').modal('show');
};
function init(){
    document.removeEventListener('DOMContentLoaded', init);
    var view = new ol.View({
        center: [1908533.467, 8551296.993],
        zoom: 11
    });
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
                alias: 'Flygbilder',
                iconName: 'plane'
            }),
            new ol.layer.Tile({
                visible: true,
                source: new ol.source.OSM(),
                name: 'OpenStreetMap',
                alias: 'Karta',
                iconName: 'globe'
            })
        ],
        view: view
    });

    var tree = new layerTree({map: map, target: 'layers'});
    map.getLayers().forEach(function(l){
        if(l.get('name'))
            tree.createRegistry(l);
    });
    function doBo(location){
        var b = ol.animation.bounce({
            resolution: map.getView().getResolution() * 2
        });
        var p = ol.animation.pan({
           source: map.getView().getCenter()
        });
        map.beforeRender(b);
        map.beforeRender(p);
        map.getView().setCenter(location);
    }
    function resetPropText(){
        document.getElementById('accuracy').innerHTML = 'Noggrannhet: - m';
        document.getElementById('altitude').innerHTML = 'Höjd över havet: - m';
        document.getElementById('altitudeAcc').innerHTML = 'Höjd över havet (Noggrannhet): - m';
        document.getElementById('heading').innerHTML = 'Bäring: - rad';
        document.getElementById('speed').innerHTML = 'Hastighet: - m/s';
    }
    var geolocation = new ol.Geolocation({
        projecton: view.getProjection()
    });
    document.getElementById('geolocation_modal_accept').addEventListener('click', function(){
        geolocation.setTracking(true);
        if(geolocation.getPosition() === undefined){
            tree.showErrorMsg('No position was found :(');
            $('#Min_position').prop( "disabled", true );
            $('#properties').toggle();
            $('div.panel.panel-default:nth-child(2)').toggle();
        }else{
            doBo(geolocation.getPosition());
        }
    });
    document.getElementById('geolocation_modal_denied').addEventListener('click', function(){
        geolocation.setTracking(false);
        resetPropText();
    });
    document.getElementById('geolocation_modal_close').addEventListener('click', function(){
        geolocation.setTracking(false);
        resetPropText();
    });
    geolocation.on('change', function(){
       document.getElementById('accuracy').innerHTML = geolocation.getAccuracy() !== undefined ? 'Noggrannhet: '+geolocation.getAccuracy() + ' m': 'Noggrannhet: - m';
       document.getElementById('altitude').innerHTML = geolocation.getAltitude() !== undefined ? 'Höjd över havet: '+geolocation.getAltitude() + ' m': 'Höjd över havet: - m';
       document.getElementById('altitudeAcc').innerHTML = geolocation.getAltitudeAccuracy() !== undefined ? 'Höjd över havet (Noggrannhet): '+geolocation.getAltitudeAccuracy() + ' m': 'Höjd över havet (Noggrannhet): - m';
       document.getElementById('heading').innerHTML = geolocation.getHeading() !== undefined ? 'Bäring: '+geolocation.getHeading() + ' rad': 'Bäring: - rad';
       document.getElementById('speed').innerHTML = geolocation.getSpeed() !== undefined ? 'Hastighet: '+geolocation.getSpeed() + ' m/s': 'Hastighet: - m/s';
    });
    geolocation.on('error', function(error){
        tree.showErrorMsg(error.message);
    });
    var accuracyFeature = new ol.Feature();
    geolocation.on('change:accuracyGeometry', function(){
       accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
    });
    var positionFeature = new ol.Feature();
    positionFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: '#3399CC'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2
            })
        })
    }));
    geolocation.on('change:position', function(){
       var coordinates = geolocation.getPosition();
       positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
    });
    new ol.layer.Vector({
       map: map,
       source: new ol.source.Vector({
           features: [accuracyFeature, positionFeature]
       })
    });
}
document.addEventListener('DOMContentLoaded', init);