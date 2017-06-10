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
    document.getElementById('em_model_body').innerHTML = txt;
    $('#em_model').modal('show');
};
///////////////// SANDBOX ////////////////////////////////
function init(){
    document.removeEventListener('DOMContentLoaded', init);
    ////////////////////////// VARIABLES ///////////////////////////////////
    var thread;
    var view = new ol.View({
        center: [1908533.467, 8551296.993],
        zoom: 5,
        minZoom: 4,
        maxZoom: 19
    });
    var map = new ol.Map({
        target: "map",
        layers: [
            new ol.layer.Tile({
                visible: false,
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
            }),
            new ol.layer.Vector({
                visible: true,
                source: new ol.source.Vector({}),
                name: 'Geolocation',
                alias: 'GPS',
                iconName: 'signal'
            }),
            new ol.layer.Vector({
                visible: true,
                source: new ol.source.Vector({
                    url: '/points',
                    format: new ol.format.GeoJSON()
                }),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        fill: new ol.style.Fill({color: 'rgba(254,165,83,1)'}),
                        stroke: new ol.style.Stroke({color: 'rgba(254,127,14,1)', width: 3})
                    })
                }),
                name: 'Points',
                alias: 'Väghinder',
                iconName: 'exclamation-triangle'
            })
        ],
        controls: [
            new ol.control.MousePosition({
                coordinateFormat: function (coordinates) {
                    var x = coordinates[0].toFixed(3);
                    var y = coordinates[1].toFixed(3);
                    return x + ' ' + y;
                }// TARGET variant A eller variant B etc..
            })
        ],
        view: view
    });
    var tree = new layerTree({map: map, target: 'layers'});
    map.getLayers().forEach(function(l){
        if(l.get('name'))
            tree.createRegistry(l);
    });
    var geolocation = new ol.Geolocation({
        projection: view.getProjection(),
        options: {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 0
        }
    });
    //////////////////////// FUNCTIONS ////////////////////////////////
    function pantopoint(geolocation){
        var point = ol.proj.transform(geolocation.getPosition(), 'EPSG:3857','EPSG:4326');
        view.animate({
            center: ol.proj.fromLonLat(point),
            zoom: 12,
            duration: 2000
        })
    }
    function resetPropText(){
        document.getElementById('accuracy').innerHTML = 'Noggrannhet: - m';
        document.getElementById('altitude').innerHTML = 'Höjd över havet: - m';
        document.getElementById('altitudeAcc').innerHTML = 'Höjd över havet (Noggrannhet): - m';
        document.getElementById('heading').innerHTML = 'Bäring: - rad';
        document.getElementById('speed').innerHTML = 'Hastighet: - m/s';
    }
    ///////////// TEST EXTENT
    //var mapExtent = map.getView().calculateExtent(map.getSize());
    //var vectorSource = new ol.source.Vector({wrapX: false});
    //var thing = new ol.geom.Polygon( [[
    //    [1907394.0775471241, 8552246.484210731],
    //    [1907394.0775471241, 8550347.50178927],
    //    [1909672.8564528758, 8550347.50178927],
    //    [1909672.8564528758, 8552246.484210731]
    //]]);
    //var featurething = new ol.Feature({
    //    name: "Thing",
    //    geometry: thing
    //});
    //vectorSource.addFeature( featurething );
    //vectorLayer = new ol.layer.Vector({wrapX: false, source: vectorSource});
    //map.addLayer(vectorLayer);
    //var vectorExtent = vectorSource.getExtent();

    function doZoom(){
        if(doZoomIN(map, geolocation.getAccuracyGeometry().getExtent()) == true && doZoomOUT(map, geolocation.getAccuracyGeometry().getExtent()) == false){
            //zooma in
            map.getView().setZoom(map.getView().getZoom() + Math.pow(0.1,2));
            thread = setTimeout(function(){ doZoom(); }, 1);
        } else if (doZoomIN(map, geolocation.getAccuracyGeometry().getExtent()) == false && doZoomOUT(map, geolocation.getAccuracyGeometry().getExtent()) == true){
            //zooma ut
            map.getView().setZoom(map.getView().getZoom() - Math.pow(0.1,2));
            thread = setTimeout(function(){ doZoom(); }, 1);
        } else {
            clearTimeout(thread);
        }
    }
    function doZoomIN(map, vector){
        var map = map.getView().calculateExtent(map.getSize());
        return ol.extent.containsExtent(map, vector);
    }
    function doZoomOUT(map, vector){
        var map = map.getView().calculateExtent(map.getSize());
        return ol.extent.containsExtent(vector, map);
    }

    ///////////////// EVENTS SANDOBOX ////////////////////////////////
    //map.on('moveend', function(e){
        //mapExtent = map.getView().calculateExtent(map.getSize());
        //var equal = ol.extent.equals(mapExtent, vectorExtent);
        //console.log(equal);
        //console.log('Do zoom in: '+doZoomIN(map, vectorExtent));
        //console.log('Do zoom out: '+doZoomOUT(map, vectorExtent));
    //});
    /////////////////////// EVENTS ////////////////////////////////////
    document.getElementById('Report').addEventListener('click', function(){
        doZoom();
        $('#meny').collapse('hide');
    });

    document.getElementById('geolocation_modal_accept').addEventListener('click', function(){
        geolocation.setTracking(true);
        $('#meny').collapse('hide');
    });
    document.getElementById('geolocation_modal_denied').addEventListener('click', function(){
        geolocation.setTracking(false);
        resetPropText();
        $('#meny').collapse('hide');
    });
    document.getElementById('geolocation_modal_close').addEventListener('click', function(){
        geolocation.setTracking(false);
        resetPropText();
        $('#meny').collapse('hide');
    });
    geolocation.on('change', function(){
       document.getElementById('accuracy').innerHTML = geolocation.getAccuracy() !== undefined ? 'Noggrannhet: '+geolocation.getAccuracy() + ' m': 'Noggrannhet: - m';
       document.getElementById('altitude').innerHTML = geolocation.getAltitude() !== undefined ? 'Höjd över havet: '+geolocation.getAltitude() + ' m': 'Höjd över havet: - m';
       document.getElementById('altitudeAcc').innerHTML = geolocation.getAltitudeAccuracy() !== undefined ? 'Höjd över havet (Noggrannhet): '+geolocation.getAltitudeAccuracy() + ' m': 'Höjd över havet (Noggrannhet): - m';
       document.getElementById('heading').innerHTML = geolocation.getHeading() !== undefined ? 'Bäring: '+geolocation.getHeading() + ' rad': 'Bäring: - rad';
       document.getElementById('speed').innerHTML = geolocation.getSpeed() !== undefined ? 'Hastighet: '+geolocation.getSpeed() + ' m/s': 'Hastighet: - m/s';
       if(geolocation.getPosition() !== undefined)
           pantopoint(geolocation);
           geoExtent = geolocation.getAccuracyGeometry().getExtent();
    });
    geolocation.on('error', function(error){
        tree.showErrorMsg(error.message);
    });
    var accuracyFeature = new ol.Feature();
    geolocation.on('change:accuracyGeometry', function() {
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
    geolocation.on('change:position', function() {
        var coordinates = new ol.geom.Point(ol.proj.transform(geolocation.getPosition(), 'EPSG:3857','EPSG:4326'));
        positionFeature.setGeometry(coordinates ? coordinates : null);
    })
    map.getLayers().forEach(function(l){
        if(l.get('alias') === 'GPS'){
            var s = l.getSource();
            s.addFeature(accuracyFeature, positionFeature);
        }
    });
    $('.Geolocation_checkbox').on('change', function(){
        if(this.checked){
            if(geolocation.getPosition() === undefined){
                tree.showErrorMsg('Aktivera din position genom att klicka på Min positionen i menyn.')
            } else {
                pantopoint(geolocation);
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', init);