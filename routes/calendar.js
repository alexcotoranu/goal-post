var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var MONTH_NAMES = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
var DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

router.get('/', function(req, res) {
  var now = new Date();
  res.redirect('/calendar/' + now.getFullYear() + '/' + (now.getMonth() + 1));
});

router.get('/:year/:month', function(req, res, next) {
  var year  = parseInt(req.params.year,  10);
  var month = parseInt(req.params.month, 10); // 1-based

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    var now = new Date();
    return res.redirect('/calendar/' + now.getFullYear() + '/' + (now.getMonth() + 1));
  }

  var minDate    = new Date(year, month - 1, 1);
  var nextMonthStart = new Date(year, month, 1);

  var prevD = new Date(year, month - 2, 1);
  var nextD = new Date(year, month,     1);

  // Tasks with target date in this month
  mongoose.model('Task').find({
    target: { $gte: minDate, $lt: nextMonthStart }
  }, function(err, tasks) {
    if (err) return next(err);

    var today = new Date(); today.setHours(0, 0, 0, 0);

    // Map day → tasks
    var dayMap = {};
    tasks.forEach(function(task) {
      var d = new Date(task.target).getDate();
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(task);
    });

    // Calendar grid (Mon-first)
    var firstDow = minDate.getDay(); // 0=Sun
    var offset   = firstDow === 0 ? 6 : firstDow - 1; // Mon=0

    var totalDays = new Date(year, month, 0).getDate();
    var cells = [];

    for (var i = 0; i < offset; i++) cells.push(null);
    for (var d = 1; d <= totalDays; d++) {
      var cellDate = new Date(year, month - 1, d);
      cellDate.setHours(0, 0, 0, 0);
      cells.push({ day: d, isToday: cellDate.getTime() === today.getTime(), tasks: dayMap[d] || [] });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    var weeks = [];
    for (var w = 0; w < cells.length; w += 7) weeks.push(cells.slice(w, w + 7));

    res.render('calendar/index', {
      title:     MONTH_NAMES[month - 1] + ' ' + year,
      monthName: MONTH_NAMES[month - 1],
      year:  year,
      month: month,
      weeks: weeks,
      dayNames: DAY_NAMES,
      prevYear:  prevD.getFullYear(),
      prevMonth: prevD.getMonth() + 1,
      nextYear:  nextD.getFullYear(),
      nextMonth: nextD.getMonth() + 1
    });
  });
});

module.exports = router;
