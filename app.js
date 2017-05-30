var express = require('express');
var app = express();
app.disable('x-powered-by');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(require('body-parser').urlencoded({extended: true }));
var formidable = require('formidable');
var credentials = require('./credentials.js');
app.use(require('cookie-parser')(credentials.cookieSecret));
app.set('port', process.env.PORT || 8080);
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
   res.render('home');
});
app.use(function(req, res, next){
   console.log("Looking for URL: "+req.url);
   next();
});
app.get('/about', function(req, res){
    res.render('about');
});
app.get('/contact', function(req, res){
   res.render('contact', {csrf: 'CSRF token here'});
});
app.get('/thankyou', function(req, res){
   res.render('thankyou');
});
app.post('/process', function(req, res){
   console.log('Form: ' + req.query.form);
   console.log('CSRF token: ' + req.body._csrf);
   console.log('Email: ' + req.body.email);
   console.log('Question : ' + req.body.ques);
   res.redirect(303, '/thankyou');
});
app.get('/file-upload', function(req, res){
    var now = new Date();
    res.render('file-upload',{
        year: now.getFullYear(),
        month: now.getMonth() });
});
// file-upload.handlebars contains the form that calls here
app.post('/file-upload/:year/:month',
    function(req, res){
        // Parse a file that was uploaded
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, file){
            if(err)
                return res.redirect(303, '/error');
            console.log('Received File');

            // Output file information
            console.log(file);
            res.redirect( 303, '/thankyou');
        });
    });
app.listen(app.get('port'), function() {
   console.log('Express started!');
   console.log('Server running at http://127.0.0.1:8080');
   console.log('Press Ctrl-C to quit');
});
