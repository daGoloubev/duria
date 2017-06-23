var express = require('express');
var router = express.Router();

// psql package import
var pg = require('pg');
var conString = 'postgres://CoolTrane:@192.168.1.3/CoolTrane'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
/* GET pg json data. */
router.get('/points', function (req, res) {
        var client = new pg.Client(conString);
        client.connect();
        var query = client.query(
            "SELECT row_to_json(fc) "+
            "FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features "+
            "FROM (SELECT 'Feature' As type "+
            ", ST_AsGeoJSON(lg.geom)::json As geometry "+
            ", row_to_json((SELECT l FROM (SELECT id, img64) As l "+
            ")) As properties "+
            "FROM loc As lg   ) As f )  As fc;");
        query.on("row", function (row, result) {
            result.addRow(row);
        });
        query.on("end", function (result) {
            res.send(result.rows[0].row_to_json);
            res.end();
        });
        query.on("error", function(results){
           res.end();
        });
});
// Add data
router.post('/report', function(req, res, next) {
    var x = req.body.x_coordinates;
    var y = req.body.y_coordinates;
    var img = req.body.img_baseg64;
    // PREPARED STATEMENT FUNGERAR EJ.... query, [v1, v2]
    var q = "INSERT INTO loc(geom) VALUES (ST_GeomFromText('POINT($1  $2)', 4326));";
    var q2 = "INSERT INTO loc(geom) VALUES (ST_GeomFromText('POINT("+x+" "+y+"), 4326));";
    var q3 = "INSERT INTO loc(geom, img64) VALUES (" +
             "ST_GeomFromText('POINT("+x+" "+y+")', 4326)," +
             "'"+img+"'"+
             ");"
    pg.connect(conString, function(err, client, done){
        if(err){
            done();
            return res.status(500).json({success: false, data: err});
        }
        // GÖR OM
        client.query(q3, function(err, result){
            done();
            if(err){
                done();
                return res.status(500).json({success: false, data: err, x: x, y: y, q: q, q3: q3});
            }
            //if(err) return res.send(err);
            res.redirect('/');
        });
        //[req.body.name]
    });
});

module.exports = router;
