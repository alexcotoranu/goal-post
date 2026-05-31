var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

router.get('/', function(req, res, next) {
  mongoose.model('Task').find({}, function(err, tasks) {
    if (err) return next(err);

    var datable = tasks.filter(function(t) { return t.target; });

    if (datable.length === 0) {
      return res.render('roadmap/index', { title: 'Roadmap', groups: [], months: [], todayPct: '50' });
    }

    var today = new Date(); today.setHours(0, 0, 0, 0);

    // Date range: earliest task start → latest target
    var minD = datable.reduce(function(m, t) {
      var d = t.created || t.target; return d < m ? d : m;
    }, datable[0].created || datable[0].target);

    var maxD = datable.reduce(function(m, t) {
      return t.target > m ? t.target : m;
    }, datable[0].target);

    // Snap to month boundaries
    var start = new Date(minD.getFullYear(), minD.getMonth(), 1);
    var end   = new Date(maxD.getFullYear(), maxD.getMonth() + 1, 0);

    // Minimum 3-month window
    if (end - start < 90 * 86400000) {
      end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
    }

    var totalMs = end - start;

    // Month header segments
    var months = [];
    var cur = new Date(start);
    while (cur <= end) {
      var mStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
      var mEnd   = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      var left  = Math.max(0, (mStart - start) / totalMs * 100);
      var right = Math.min(100, (mEnd   - start) / totalMs * 100);
      months.push({
        label: MONTHS[cur.getMonth()] + ' \'' + String(cur.getFullYear()).slice(-2),
        left:  left.toFixed(2),
        width: (right - left).toFixed(2)
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    // Group and annotate tasks
    var groupMap = {};
    datable.forEach(function(task) {
      var prefix = task.catprefix || 'Uncategorized';
      if (!groupMap[prefix]) groupMap[prefix] = [];

      var barStart = task.created || task.target;
      var barEnd   = task.target;
      var left  = Math.max(0,   (barStart - start) / totalMs * 100);
      var right = Math.min(100, (barEnd   - start) / totalMs * 100);

      groupMap[prefix].push({
        task:      task,
        left:      left.toFixed(2),
        width:     Math.max(0.5, right - left).toFixed(2),
        isDone:    !!task.completed,
        isOverdue: !task.completed && task.target < today,
        label:     (task.catprefix || '') + (task.idincat ? '-' + String(task.idincat).padStart(3,'0') : '') + ' ' + (task.title || '')
      });
    });

    var groups = Object.keys(groupMap).sort().map(function(prefix) {
      var rows = groupMap[prefix].sort(function(a, b) {
        return (a.task.created || a.task.target) - (b.task.created || b.task.target);
      });
      return { prefix: prefix, rows: rows };
    });

    var todayPct = Math.max(0, Math.min(100, (today - start) / totalMs * 100)).toFixed(2);

    res.render('roadmap/index', {
      title: 'Roadmap',
      groups: groups,
      months: months,
      todayPct: todayPct
    });
  });
});

module.exports = router;
