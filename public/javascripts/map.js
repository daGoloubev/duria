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
          range_txt.innerHTML = 'Transparent: 100%';

          layer_range.addEventListener('input', function(){
              layer.setOpacity(this.value);
              range_txt.innerHTML = 'Transparent: '+Math.floor(this.value*100)+'%';
          });
          layer_range.addEventListener('change', function(){
              layer.setOpacity(this.value);
              range_txt.innerHTML = 'Transparent: '+Math.floor(this.value*100)+'%';
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
var layersOpen = false;
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
    var media_book = [];
    var start_page = 0;
    var finns_pointsSource = new ol.source.Vector();
    var läggtill_pointsSource = new ol.source.Vector();
    var tabort_pointsSource = new ol.source.Vector();

    /**
     * Reverse - from lowest to highest
     * IDC - Id Compare
     * Used with arr.sort(compare).
     * arr - is a JSON Object with properties and id.
     */
    function reverseIDC(a, b) {
        var i = a.properties.id;
        var ii = b.properties.id;
        var c = 0;
        if (i > ii) {
            c = 1;
        } else if (i < ii) {
            c = -1;
        }
        return c;
    }

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
                            date: feature.properties.date,
                            tid: feature.properties.tid,
                            accuracy: feature.properties.accuracy,
                            status: feature.properties.status,
                            img: feature.properties.img64
                        });
                        pointsSource.addFeature(tmp);
                        if(tmp.get('status') === 'Bekräftad'){
                            finns_pointsSource.addFeature(tmp);
                        } else if (tmp.get('status') === 'LäggTill'){
                            läggtill_pointsSource.addFeature(tmp);
                        } else if(tmp.get('status') === 'TaBort') {
                            tabort_pointsSource.addFeature(tmp);
                        }
                    }
                });
                // Create mediaBook
                var step = 1;
                //var length = features.length - 1;
                var length = features.length;
                // SORTERA DATA
                features = features.sort(reverseIDC);
                //features.forEach(function(i){
               //    console.log(i.properties.id);
                //})
                var page = [];
                while (length > - 1) {
                    // save last
                    var last = features[length - 1];
                        // Add to page.
                            if(page.length < rss_items){
                                //console.log(last.properties.id);
                                page.push(last);
                            } else {
                                media_book.push(page);
                                page = [];
                                page.push(last);
                            }
                    // remove last
                    features.pop();
                    // increase step
                    length = length - step;
                }
                media_book.push(page);
                //console.log(media_book[1][0]);
                $('#feed_total_page_number').text(String(media_book.length));

                fillMediaData(rss_items)
            });
        }
    });
    var map = new ol.Map({
        target: "map",
        layers: [
            //new ol.layer.Tile({
            //    visible: false,
            //    source: new ol.source.BingMaps({
            //        key: 'Aj0LLnXkcQViB8dmKhWrqiVDbhKqJUE3-ROu6f6NKQbL73li6F_Ob7aHEyMCBmcw',
            //        imagerySet: 'Aerial'
            //    }),
            //    name: 'BingMapsAerial',
            //    alias: 'Flygbilder BING',
            //    iconName: 'plane'
            //}),
            //new ol.layer.Tile({
            //    visible: false,
            //    source: new ol.source.OSM(),
            //    name: 'OpenStreetMap',
            //    alias: 'OSM',
            //    iconName: 'globe'
            //}),
            //new ol.layer.Tile({
            //    visible: true,
            //    source: new ol.source.TileWMS({
            //        url: 'https://duria.se:8443/geoserver/duria/wms?service=WMS&version=1.1.0&request=GetMap&layers=duria:orto025&srs=EPSG:4326'
            //    }),
            //    name: 'TopoMap',
            //    alias: 'Ortofoto',
            //    iconName: 'fighter-jet'
            //}),
            new ol.layer.Tile({
                visible: true,
                source: new ol.source.TileWMS({
                    url: 'https://duria.se:8443/geoserver/duria/wms?service=WMS&version=1.1.0&request=GetMap&layers=duria:topowebbkartan&srs=EPSG:4326'
                }),
                name: 'TopoMap',
                alias: 'Webbkarta',
                iconName: 'map-o'
            }),
            new ol.layer.Vector({
                visible: true,
                source: new ol.source.Vector(),
                name: 'Geolocation',
                alias: 'GPS',
                iconName: 'location-arrow'
            }),
            new ol.layer.Vector({
                visible: true,
                source: pointsSource,
                style: new ol.style.Style({
                    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                        src: '/images/roadblocks/rework/standard.png',
                        scale: 0.25

                    }))
                }),
                name: 'Points',
                alias: 'Alla',
                iconName: 'exclamation-triangle'
            }),
            new ol.layer.Vector({
                visible: true,
                source: tabort_pointsSource,
                name: 'tabort_Points',
                style: new ol.style.Style({
                    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                        src: '/images/roadblocks/rework/tabort.png',
                        scale: 0.25

                    }))
                }),
                name: 'tabort_Points',
                alias: 'Ta bort',
                iconName: 'minus'
            }),
            new ol.layer.Vector({
                visible: true,
                source: läggtill_pointsSource,
                style: new ol.style.Style({
                    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                        src: '/images/roadblocks/rework/läggtill.png',
                        scale: 0.25
                    }))
                }),
                name: 'läggtill_Points',
                alias: 'Lägg till',
                iconName: 'plus'
            }),
            new ol.layer.Vector({
                visible: true,
                source: finns_pointsSource,
                style: new ol.style.Style({
                    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                        src: '/images/roadblocks/rework/bekräftad.png',
                        scale: 0.25

                    }))
                }),
                name: 'finns_Points',
                alias: 'Finns',
                iconName: 'check'
            })
        ],
        controls: [
            //new ol.control.MousePosition({
            //   coordinateFormat: function (coordinates) {
            //        //var x = coordinates[0].toFixed(3);
            //        //var y = coordinates[1].toFixed(3);
            //       var x = coordinates[0];
            //       var y = coordinates[1];
            //       //console.log(x + ' ' + y);
            //        return x + ' ' + y;
            //        //var t = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
            //        //var sf = ol.coordinate.createStringXY(2);
            //        //return sf(t);
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
    map.getLayers().insertAt(0,
        new ol.layer.Tile({
            visible: true,
            source: new ol.source.TileWMS({
                url: 'https://duria.se:8443/geoserver/duria/wms?service=WMS&version=1.1.0&request=GetMap&layers=duria:orto025&srs=EPSG:4326'
            })
        })
    );
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
            if(layer.get('name') == 'Points'){
                return layer.get('name') == 'Points';
            } else if(layer.get('name') == 'tabort_Points'){
                return layer.get('name') == 'tabort_Points';
            } else if(layer.get('name') == 'läggtill_Points'){
                return layer.get('name') == 'läggtill_Points';
            } else if(layer.get('name') == 'finns_Points'){
                return layer.get('name') == 'finns_Points';
            }
        }
    });

    var selectContainer = document.getElementById('popup-select');
    var selectCloser  = document.getElementById('popup-closer-select');
    var selectOverlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
        element: selectContainer,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    }));
    map.addOverlay(selectOverlay);
    map.addControl(new ol.control.Zoom());
    map.addControl(new ol.control.Rotate());
    //////////////////////// FUNCTIONS ////////////////////////////////
    function fillMediaData(n){
        for(var i = 0; i < n; i++){
            if(media_book[start_page][i] !== undefined)
                setMediaData(i, media_book[start_page][i]);
        }
    }
    function setMediaData(p, f){
        var id_src = '#'+p+'_media_post';
        var img_src = id_src+'_img';
        var lat_src = id_src+'_lat';
        var lng_src = id_src+'_lng';
        var acc_src = id_src+'_acc';
        var i = f.properties.img64;
        var lat = f.geometry.coordinates[0];
        var lng = f.geometry.coordinates[1];
        var a = f.properties.accuracy;

        $(lat_src).text(lat);
        $(lng_src).text(lng);

        if (typeof a === 'undefined' || !a){
            $(acc_src).text('- m');
        } else {
            $(acc_src).text(a);
        }
        if (typeof i === 'undefined' || !i) {
            if(f.properties.status === 'Bekräftad'){
                $(img_src).prop('src', '/images/roadblocks/rework/bekräftad.png');
            } else if(f.properties.status === 'LäggTill') {
                $(img_src).prop('src', '/images/roadblocks/rework/läggtill.png');
            } else if(f.properties.status === 'TaBort'){
                $(img_src).prop('src', '/images/roadblocks/rework/tabort.png');
            }
        } else {
            $(img_src).prop('src', i);
        }
    }

    function resetPropText(){
        document.getElementById('accuracy').innerHTML = 'Noggrannhet: - m';
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
    /**
     *  Calculate new marginX
     */
    function getMarginX(windowWidth, popupWidth){
        var halfWidth = windowWidth / 2;
        var actualSize = halfWidth + popupWidth;
        var popupMargin = windowWidth - actualSize;
        return popupMargin / 2;
    }
    selectSingleClick.on('select', function(evt){
            closeSelect();
            $('.navbar-collapse').collapse('hide');
            var f = evt.selected[0];
            var c = f.getGeometry().getCoordinates();
            selectOverlay.setPosition(c);
            if(windowWidth < 1200 && !layersOpen){
                view.centerOn(c, map.getSize(), [getMarginX(windowWidth, 50), 400]);
            } else if(windowWidth < 1200 && layersOpen){
                view.centerOn(c, map.getSize(), [400, 400]);
            } else {
                view.setCenter(c);
            }
            var d = f.get('date');
            var t = f.get('tid');
            var s = f.get('status');
            var i = f.get('img');
            if(s === 'Bekräftad'){
                $('#popup-content-finns_i_verkligheten').text('Ja');
                $('#popup-content-finns_i_karta').text('Ja');
            } else if(s === 'LäggTill'){
                $('#popup-content-finns_i_verkligheten').text('Ja');
                $('#popup-content-finns_i_karta').text('Nej');
            } else if(s === 'TaBort'){
                $('#popup-content-finns_i_verkligheten').text('Nej');
                $('#popup-content-finns_i_karta').text('Ja');
            }
            $('#popup-content-select-date').text(d);
            $('#popup-content-select-tid').text(t);
            $('#popup-content-select-status').text(s);
            if (typeof i === 'undefined' || !i) {
                if(s === 'Bekräftad'){
                    $('#popup-content-select-img').prop('src', '/images/roadblocks/rework/bekräftad.png');
                } else if(s === 'LäggTill') {
                    $('#popup-content-select-img').prop('src', '/images/roadblocks/rework/läggtill.png');
                } else if(s === 'TaBort'){
                    $('#popup-content-select-img').prop('src', '/images/roadblocks/rework/tabort.png');
                }
            } else {
                $('#popup-content-select-img').prop('src', i);
            }
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
        closeSelect();
        var c = evt.feature.getGeometry().getCoordinates();
        if(windowWidth < 1200 && !layersOpen){
            view.centerOn(c, map.getSize(), [getMarginX(windowWidth, -50), 400]);
        } else if(windowWidth < 1200 && layersOpen){
            view.centerOn(c, map.getSize(), [400, 400]);
        } else {
            view.setCenter(c);
        }
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
        //video.show();
        // Style button
        var sketchDiv = document.getElementById('sketch-holder');
        var snapButton = sketchDiv.getElementsByTagName('Button')[0];
        snapButton.setAttribute('class', 'btn btn-info fixed-width snapButton');
        snapButton.setAttribute('style', 'margin-top: 10px;');
        var resetButton = sketchDiv.getElementsByTagName('Button')[1];
        resetButton.setAttribute('class', 'btn btn-warning fixed-width');
        resetButton.setAttribute('style', 'margin-top: 10px;');
        // Video

        if(windowWidth <= 441){
            var videoElement = sketchDiv.getElementsByTagName('video')[0];
            videoElement.setAttribute('style', 'width: 100%; height: 25%; display: block;');
        }
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
        view.animate({
            center: geolocation.getPosition(),
            zoom: 18,
            duration: 2000
        });
        min_pos_info_show = true;
    });
    $('#geolocation_modal_denied').on('click', function(){
        $('#meny').collapse('hide');
        geolocation.setTracking(false);
        resetPropText();
        min_pos_info_show = false;
    });
    $('#geolocation_modal_close').on('click', function(){
        $('#meny').collapse('hide');
        geolocation.setTracking(false);
        resetPropText();
        min_pos_info_show = false;
    });
    geolocation.on('change', function(){
       //$('#accuracy').innerHTML = geolocation.getAccuracy() !== undefined ? 'Noggrannhet: '+geolocation.getAccuracy() + ' m': 'Noggrannhet: - m';
        $('#accuracy').html(geolocation.getAccuracy() !== undefined ? 'Noggrannhet: '+geolocation.getAccuracy() + ' m': 'Noggrannhet: - m');
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
        view.setCenter(coordinates ? coordinates : null);
    });
    /**
     * Attach event to 'Min position'
     * Open only once.
     */
    var min_pos_info_show = false;
    $('#Min_position').on('click', function(){
        if(min_pos_info_show){
            view.animate({
                center: geolocation.getPosition(),
                zoom: view.getZoom(),
                duration: 1000
            });
        } else {
            $('#geolocation_modal').modal('show');
        }
    });
    /**
     * Attach event to 'Rapport'
     * Open Info Rapport window only once.
     *
     */
    var rapport_info_show = false;
    $('#Report').on('click', function(){
        if(rapport_info_show){
            // RAPPORTERA IGEN
            unCheckRadio();
            drawSource.clear();
            // CLOSE POPUP
            submitOverlay.setPosition(undefined);
            map.removeInteraction(draw);
            map.addInteraction(draw);
        } else {
            $('#report_modal').modal('show');
            rapport_info_show = true;
        }
    });

    $('#popup-closer-submit').on('click', function(){
        rapport_info_show = true;
        unCheckRadio();
    });
    $('#popup-submit-cancel').on('click', function(){
        rapport_info_show = true;
        unCheckRadio();
    });
    $('#report_modal_close').on('click',function(){
        rapport_info_show = false;
    });
    $('#report_modal_denied').on('click',function(){
        rapport_info_show = false;
    });

    /**
     * Uncheck radiobuttons
     *
    */
    function unCheckRadio(){
        document.forms["myForm"]["Finns_i_falt"][0].checked = false;
        document.forms["myForm"]["Finns_i_falt"][1].checked = false;
        document.forms["myForm"]["Finns_i_karta"][0].checked = false;
        document.forms["myForm"]["Finns_i_karta"][1].checked = false;
    }
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

    /**
     * Changing RSS page
     *
     */
    var rss_items = 3; // Holds the number of items per page.
    $('#rss_previous').on('click', function(){
        if(start_page != 0){
            start_page--;
            var t = start_page + 1;
            $('#current_page').text(String(t));
            if (start_page !== media_book.length){
                for(var i = 0 ; i < rss_items; i++){
                    if($(String('#'+i)+'_media_post').css('display') === 'none') {
                        $(String('#'+i)+'_media_post').css('display', 'block');
                    }
                }
                fillMediaData(rss_items);
            }
        }
    });
    $('#rss_next').on('click', function(){
        if(start_page < media_book.length){
            start_page++;
            var t = (start_page + 1) <= media_book.length ? (start_page + 1) : start_page;
            $('#current_page').text(String(t));
            if (start_page !== media_book.length){
                if(media_book.length === rss_items){
                    fillMediaData(rss_items);
                } else {
                    // fyll på med resten
                    // gör resten osynliga
                    // fillMediaData(media_book.length);
                    var rest = rss_items - media_book[start_page].length;
                    //fillMediaData(rest);
                    //if(rest == 1){
                    //    document.getElementById('1_media_post').remove();
                    //    document.getElementById('2_media_post').remove();
                    //} else if(rest == 2){
                    //    document.getElementById('2_media_post').remove();
                    //}
                    // remove resten
                    // om resten är 1 då ska 2,1 bort
                    // om resten är 2 då ska 2 bort

                    for(var i = (rss_items - 1); i > (rest - 1); i--){
                        var id = String(i)+"_media_post";
                        $("#"+id).css('display', 'none');
                        //console.log(id);
                    }
                    fillMediaData(media_book[start_page].length);
                }
                //console.log(media_book[start_page].length);
            }
        }
    });
    /**
     * Attach events to media links
     * */
    for(var i = 0 ; i < rss_items; i++){
        $(String('#'+i)+'_media_post_').on('click', function(){
            var lat = $("#"+String(this.id)+'lat').text();
            var lng = $("#"+String(this.id)+'lng').text();
            var point = new ol.geom.Point(ol.proj.transform([lat, -(-lng)], 'EPSG:4326', 'EPSG:3857'));
            tree.map.getView().animate({
                center: point.getCoordinates(),
                zoom: 18,
                duration: 2000
            });
            $(".sidebar-right .sidebar-body").toggle();
            $('.mini-submenu-right').toggle();
            applyMargins();
        });
    }
    /**
     * Attach events to window on load
     */
    $(window).one('load',function(){
        // VISA MANUALEN FÖRSTA GÅNGEN
        //$('#manual_modal').modal('show');
        //$('#camera_modal').modal('show');
        if (navigator.getUserMedia) {
            navigator.getUserMedia({video: true, audio: false}, function(stream) {
            }, function(e) {
                $('#popup-submit-camera').css('display', 'none');
                });
        }
        /**
         * Add Select Interaction to map.
         */
        if(select != null){
            map.removeInteraction(select);
        }
        select = selectSingleClick;
        map.addInteraction(select);
    });
    /**
     * EventListner is Vägbommar (Finns) Visible?
     */
    var points_layer;
    var check_layer;
    var add_layer;
    var sub_layer;
    map.getLayers().forEach(function (layer) {
        if(layer.get('name') == 'Points'){
            points_layer = layer;
        } else if (layer.get('name') == 'finns_Points'){
            check_layer = layer;
        } else if (layer.get('name') == 'läggtill_Points'){
            add_layer = layer;
        } else if (layer.get('name') == 'tabort_Points'){
            sub_layer = layer;
        }
        layer.on('change:visible', function(){
           closeSelect();
           if(this.get('name') == 'finns_Points' && this.getVisible() == false && points_layer.getVisible() == true){
               if(add_layer.getVisible != false && sub_layer.getVisible() != false){
                   points_layer.setVisible(false);
                   $('.Points_checkbox').prop('checked', false);
               }
           } else if(this.get('name') == 'läggtill_Points' && this.getVisible() == false && points_layer.getVisible() == true){
               if(check_layer.getVisible != false && sub_layer.getVisible() != false){
                   points_layer.setVisible(false);
                   $('.Points_checkbox').prop('checked', false);
               }
           } else if(this.get('name') == 'tabort_Points' && this.getVisible() == false && points_layer.getVisible() == true){
               if(sub_layer.getVisible != false && add_layer.getVisible() != false){
                   points_layer.setVisible(false);
                   $('.Points_checkbox').prop('checked', false);
               }
           }
        });
    })
    /**
     * Double click event
     */
    $('#map').dblclick(function(){
        closeSelect();
    });
    /**
     * Double Tap
     */
    var tapped=false
    $("#map").on("touchstart",function(e){
        if(!tapped){
            tapped=setTimeout(function(){
                // single tap
                tapped=null
            },300); //wait 300ms
        } else {
            clearTimeout(tapped);
            tapped=null
            // double tap
            closeSelect();
        }
        e.preventDefault()
    });
}
document.addEventListener('DOMContentLoaded', init);

