var express = require('express'),
    moment = require('moment'),
    router = express.Router(),
    r = require('rethinkdb'), //rethinkdb (js driver) connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'), //used to manipulate POST
    multer = require('multer'); // used to upload files

//TODO: See if this connection can be made global
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
});

//Any requests to this controller must pass through this 'use' function
//Copy and pasted from method-override
router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
    }
}));

/* GET calendar page. */

router.route('/:year/:month')
  .get(function(req, res) {

    function daysInMonth(month,year){
      return new Date(year, month, 0).getDate();
    }

    month_labels = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    day_labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    // console.log(req.params.year + '-' + req.params.month);
    
    // var calDate = req.params.year + '-' + req.params.month;
    var lastDay = daysInMonth(req.params.month,req.params.year);
    if (lastDay < 10) {
        lastDay = '0'+lastDay;
    }

    var minDate = new Date(req.params.year, req.params.month-1, 1);
    var maxDate = new Date(req.params.year, req.params.month-1, lastDay);

    // console.log(lastDay);
    // console.log(minDate);
    // console.log(maxDate);

    // res.send('Calendar');

    var a = moment(req.params.year + '-' + req.params.month + '-01T00:00:00');
    var b = moment(req.params.year + '-' + req.params.month + '-' + lastDay + 'T23:59:59');

    var calDays = {};

    // console.log(a);
    var firstDay = a.format('E');

    for (var m = a; m.isBefore(b); m.add(1,'days')) {
        var dayInMonth = m.format('DD');
        var dayInCal = Number(dayInMonth) + Number(firstDay);
        calDays["day"+dayInCal] = dayInMonth;
    }

    // console.log(calDays);
    res.format({
        html: function(){
            res.render('calendar', {
              "cal" : calDays
            });
        },
        json: function(){
            res.json(calDays);
        }
      });
    });

module.exports = router;