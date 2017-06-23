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
function init(){
    document.removeEventListener('DOMContentLoaded', init);
    ////////////////////////// VARIABLES ///////////////////////////////////
    var date= new Date();
    var date_string = String(date.getFullYear())+'-'+String(date.getMonth())+'-'+String(date.getDate());

    var view = new ol.View({
        center: [1908533.467, 8551296.993],
        zoom: 13,
        minZoom: 4,
        maxZoom: 19
    });
    var thread;
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
    var accuracyFeature = new ol.Feature();
    accuracyFeature.setStyle();
    var geolocation = new ol.Geolocation({
        projection: view.getProjection(),
        options: {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 0
        }
    });
    var pointsSource = new ol.source.Vector({
        //strategy: ol.loadingstrategy.bbox,
        strategy: ol.loadingstrategy.all,
        // loader takes extent, resolution, projection
        loader: function() {
            $.ajax('/points').then(function(response) {
                var features = response.features;
                features.forEach(function(feature){
                    if(pointsSource.getFeatures().length < features.length){
                        var tmp = new ol.Feature({
                            id: feature.properties.id,
                            geometry: new ol.geom.Point(ol.proj.transform(feature.geometry.coordinates, 'EPSG:4326', 'EPSG:3857')),
                            img: feature.properties.img64
                        });
                        pointsSource.addFeature(tmp);
                    }
                });
                var sf = ol.coordinate.createStringXY(3);
                features.reverse().forEach(function(feature){
                    createRSSMedia(feature.properties.id, sf(feature.geometry.coordinates), feature.properties.img64);
                });
                    //createRSSMedia('1', '11.11 22.22');
            });
        }
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
                source: pointsSource,
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        fill: new ol.style.Fill({color: 'rgba(254,165,83,1)'}),
                        stroke: new ol.style.Stroke({color: 'rgba(254,127,14,1)', width: 3})
                    })
                }),
                name: 'Points',
                alias: 'Vägbommar',
                iconName: 'exclamation-triangle'
            })
        ],
        controls: [
            //new ol.control.MousePosition({
           //    coordinateFormat: function (coordinates) {
            //        //var x = coordinates[0].toFixed(3);
            //        //var y = coordinates[1].toFixed(3);
            //        //return x + ' ' + y;
            //        var t = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
            //        var sf = ol.coordinate.createStringXY(2);
            //        return sf(t);
            //    }// TARGET variant A eller variant B etc..
            //})
        ],
        view: view
    });
    var tree = new layerTree({map: map, target: 'layers'});
    map.getLayers().forEach(function(l){
        if(l.get('name'))
            tree.createRegistry(l);
    });
    map.getLayers().forEach(function(l){
        if(l.get('alias') === 'GPS'){
            var s = l.getSource();
            s.addFeature(accuracyFeature, positionFeature);
        }
    });
    var drawSource = new ol.source.Vector({ wrapX: false });
    var drawVector = new ol.layer.Vector({ source: drawSource });
    map.addLayer(drawVector);
    var draw = new ol.interaction.Draw({
        source: drawSource,
        type: 'Point'
    });
    var submitContainer = document.getElementById('popup-submit');
    var submitCancel =  document.getElementById('popup-submit-cancel');
    var x_submitPosition =  document.getElementById('popup-submit-position-x');
    var y_submitPosition =  document.getElementById('popup-submit-position-y');
    var submitdate = document.getElementById('popup-submit-date');
    var submittime = document.getElementById('popup-submit-time');
    var submitAcc = document.getElementById('popup-submit-my-position-accuracy');

    var submitCloser = document.getElementById('popup-closer-submit');
    var submitOverlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
        element: submitContainer,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    }));
    map.addOverlay(submitOverlay);
    var select = null;
    var selectSingleClick = new ol.interaction.Select({
        layers: function(layer){
            return layer.get('name') == 'Points';
        }
    });
    var selectSingleButton = document.getElementById('single-select-button');
    var selectContainer = document.getElementById('popup-select');
    var selectContent = document.getElementById('popup-content-select');
    var selectCloser  = document.getElementById('popup-closer-select');
    var selectOverlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
        element: selectContainer,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    }));
    map.addOverlay(selectOverlay);
    var feed = document.getElementById('feed');
    var feedPanel = document.createElement('div');
    feedPanel.className = 'panel-body';
    feed.append(feedPanel);
    //////////////////////// FUNCTIONS ////////////////////////////////
    function validateForm(){
        var status = document.forms["submit_form"]["status_select"].value;
        if(x === ''){
            alert('Status måste vara ifylld');
            return false;
        }
    }
    function createRSSMedia(id, coords, img){
        var media = document.createElement('div');
        media.className = 'media';
        feedPanel.append(media);
        var mediaLeft = document.createElement('div');
        mediaLeft.className = 'media-left';
        media.append(mediaLeft);
        var mediaBody = document.createElement('div');
        mediaBody.className = 'media-body';
        media.append(mediaBody);
        var mediaIMG = document.createElement('img');
        mediaIMG.className = 'media-object';
        mediaIMG.setAttribute('style', 'width:60px;');
        mediaIMG.setAttribute('src', img);
        mediaLeft.append(mediaIMG);
        var mediaBodyHeading = document.createElement('h4');
        mediaBodyHeading.className = 'media-heading';
        mediaBodyHeading.innerHTML = id;
        var mediaBodyContent = document.createElement('p');
        mediaBodyContent.innerHTML = coords;
        mediaBody.append(mediaBodyHeading);
        mediaBody.append(mediaBodyContent);
    }

    function pantopoint(){
        view.animate({
            center: geolocation.getPosition(),
            zoom: 19,
            duration: 2000
        });
    }
    // Göra om design?
    function resetPropText(){
        document.getElementById('accuracy').innerHTML = 'Noggrannhet: - m';
        document.getElementById('altitude').innerHTML = 'Höjd över havet: - m';
        document.getElementById('altitudeAcc').innerHTML = 'Höjd över havet (Noggrannhet): - m';
        document.getElementById('heading').innerHTML = 'Bäring: - rad';
        document.getElementById('speed').innerHTML = 'Hastighet: - m/s';
    }
    function adjustZoom(){
        if(needsZoomIN(map, geolocation.getAccuracyGeometry().getExtent()) == true && neeedsZoomOUT(map, geolocation.getAccuracyGeometry().getExtent()) == false){
            //zooma in
            map.getView().setCenter(geolocation.getPosition());
            map.getView().setZoom(map.getView().getZoom() + Math.pow(0.15,2));
            thread = setTimeout(function(){ adjustZoom(); }, 1);
        } else if (needsZoomIN(map, geolocation.getAccuracyGeometry().getExtent()) == false && neeedsZoomOUT(map, geolocation.getAccuracyGeometry().getExtent()) == true){
            //zooma ut
            map.getView().setCenter(geolocation.getPosition());
            map.getView().setZoom(map.getView().getZoom() - Math.pow(0.15,2));
            thread = setTimeout(function(){ adjustZoom(); }, 1);
        } else {
            clearTimeout(thread);
        }
    }
    function needsZoomIN(map, vector){
        var map = map.getView().calculateExtent(map.getSize());
        return ol.extent.containsExtent(map, vector);
    }
    function neeedsZoomOUT(map, vector){
        var map = map.getView().calculateExtent(map.getSize());
        return ol.extent.containsExtent(vector, map);
    }
    function closeSubmit(){
        submitOverlay.setPosition(undefined);
        submitCloser.blur;
        drawSource.clear(true);
        return false;
    }
    function closeSelect(){
        selectOverlay.setPosition(undefined);
        selectCloser.blur;
        select.getFeatures().clear();
        return false;
    }
    /////////////////////// EVENTS ////////////////////////////////////
   var cameraButton = document.getElementById('popup-submit');
    $('#popup-submit-camera').on('click', function(){
        $('#camera_modal').modal('show');
    });
    document.getElementById('urval_modal_denied').addEventListener('click', function(){
        $('#meny').collapse('hide');
    });
    document.getElementById('urval_modal_close').addEventListener('click', function(){
        $('#meny').collapse('hide');
    });
    document.getElementById('urval_modal_accept').addEventListener('click', function(){
        if(select != null){
            map.removeInteraction(select);
        }
        select = selectSingleClick;
        map.addInteraction(select);
        $('#meny').collapse('hide');
    });
    selectSingleClick.on('select', function(evt){
            var f = evt.selected[0];
            var c = f.getGeometry().getCoordinates();
            var t = ol.proj.transform(c, 'EPSG:3857', 'EPSG:4326');
            var sf = ol.coordinate.createStringXY(3);
            var id = f.get('id');
            //console.log(f.getProperties());
            selectOverlay.setPosition(c);
            var s = 'id: '+id+'<br> coordinates: '+sf(t);
            //selectContent.innerHTML = s;
            var img_src = f.get('img');
            var img_el = $('#popup-content-select img');
            img_el.attr('src', img_src);
        });
    selectCloser.addEventListener('click', function(){
        closeSelect();
    });
    submitCloser.addEventListener('click', function(){
        closeSubmit();
    });
    submitCancel.addEventListener('click', function(){
        closeSubmit();
    });
    document.getElementById('report_modal_accept').addEventListener('click', function(){
        map.addInteraction(draw);
        $('#meny').collapse('hide');
    });
    document.getElementById('Report').addEventListener('click', function(){
        //map.addInteraction(draw);
        $('#meny').collapse('hide');
    });
    draw.on('drawend', function(evt){
        var c = evt.feature.getGeometry().getCoordinates();
        var t = ol.proj.transform(c, 'EPSG:3857', 'EPSG:4326');
        var db_format = ol.coordinate.createStringXY(13);
        var f = db_format(t);
        //submitPosition.value = sf(t);
        x_submitPosition.value = f.split(',')[0];
        y_submitPosition.value = f.split(',')[1];
        submitdate.value = date_string;
        date = new Date();
        submittime.value = String(date.getHours()) + ':'+String(date.getMinutes())+':'+String(date.getSeconds());
        submitAcc.value = geolocation.getAccuracy() !== undefined ? String(geolocation.getAccuracy())+' m': '';
        submitOverlay.setPosition(c);
        map.removeInteraction(draw);
        // empty Canvas.
        canvas.clear();
        // Style button
        var sketchDiv = document.getElementById('sketch-holder');
        var snapButton = sketchDiv.getElementsByTagName('Button')[0];
        snapButton.setAttribute('class', 'btn btn-info snapButton');
        /**
         * Disallow empty pictures.
         */
        $('#camera_modal_accept').prop('disabled', true);
        /**
         * Enable after first-snap.
         */
        $('.snapButton').one('click', function(){
            $('#camera_modal_accept').prop('disabled', false);
        });
    });
    document.getElementById('geolocation_modal_accept').addEventListener('click', function(){
        $('#meny').collapse('hide');
        geolocation.setTracking(true);
        setTimeout(function(){
            if(geolocation.getAccuracy() < 30){
                //console.log(geolocation.getAccuracy())
                pantopoint();
            } else {
                tree.showErrorMsg('Nogrannheten överskred 30m.');
                //console.log(geolocation.getAccuracy());
            }
        }, 1000);
    });
    document.getElementById('geolocation_modal_denied').addEventListener('click', function(){
        $('#meny').collapse('hide');
        geolocation.setTracking(false);
        resetPropText();
    });
    document.getElementById('geolocation_modal_close').addEventListener('click', function(){
        $('#meny').collapse('hide');
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
    geolocation.on('change:accuracyGeometry', function() {
        accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
    });
    geolocation.on('change:position', function() {
        var coordinates = new ol.geom.Point(ol.proj.transform(geolocation.getPosition(), 'EPSG:3857','EPSG:4326'));
        positionFeature.setGeometry(coordinates ? coordinates : null);

    });
    $('.Geolocation_checkbox').on('change', function(){
        if(this.checked){
            if(geolocation.getPosition() === undefined){
                tree.showErrorMsg('Aktivera din position genom att klicka på Min positionen i menyn.');
            } else {
                // pantopoint(geolocation);
                // adjustZoom();
            }
        }
    });

    /**
     * EventHandling for Camera modal
     * Saving snap as base64 dataURL.
    */
    $('#camera_modal_accept').on('click', function(){
        var canvas = document.getElementById('defaultCanvas0');
        var url = canvas.toDataURL();
        var input = $('#popup-submit-img-base64');
        input.val(url);
    });
    /**
     * EventHandling for Camera modal
     * Empty the input
     */
    $('#camera_modal_denied').on('click', function(){
        var input = $('#popup-submit-img-base64').val('');
    });

}
document.addEventListener('DOMContentLoaded', init);

