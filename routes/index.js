var express = require('express');
var router = express.Router();

// psql package import
var pg = require('pg');
var conString = 'postgres://CoolTrane:@192.168.1.3/CoolTrane'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Duria.se'
  });
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
            ", row_to_json((SELECT l FROM (SELECT id) As l "+
            ")) As properties "+
            "FROM loc As lg   ) As f )  As fc;");
        query.on("row", function (row, result) {
            result.addRow(row);
        });
        query.on("end", function (result) {
            res.send(result.rows[0].row_to_json);
            res.end();
        });
});
// Add data
router.post('/add', function(req, res, next) {
    pg.connect(conString, function(err, client, done){
        if(err){
         done();
         return res.status(500).json({success: false, data: err});
        }
        // GÖR OM
        client.query("INSERT INTO loc(geom) VALUES (ST_GeomFromText('POINT(17.9349051315434 60.1754333770934)', 4326));", function(err, result){
                done();
                if(err) return res.send(err);
                res.redirect('/');
            });
        //[req.body.name]
    });
});


module.exports = router;
