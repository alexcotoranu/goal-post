var express = require('express');
var moment = require('moment');
var router = express.Router();

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