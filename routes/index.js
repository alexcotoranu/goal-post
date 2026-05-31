var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

router.get('/', function(req, res, next) {
  mongoose.model('Task').find({}, function(err, tasks) {
    if (err) return next(err);

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var in3   = new Date(today); in3.setDate(in3.getDate() + 3);

    var focusTasks = [];
    var groupMap   = {};

    tasks.forEach(function(task) {
      var target = task.target ? new Date(task.target) : null;
      if (target) target.setHours(0, 0, 0, 0);
      var isDone = !!task.completed;

      var urgency = null;
      if (!isDone && target) {
        if (target < today) urgency = 'overdue';
        else if (target.getTime() === today.getTime()) urgency = 'today';
        else if (target <= in3 && task.priority >= 3) urgency = 'soon';
      }
      if (!isDone && !urgency && task.priority >= 4) urgency = 'high';
      if (urgency) focusTasks.push({ task: task, urgency: urgency });

      var prefix = task.catprefix || 'Uncategorized';
      if (!groupMap[prefix]) groupMap[prefix] = { prefix: prefix, total: 0, done: 0, overdue: 0, focus: 0 };
      groupMap[prefix].total++;
      if (isDone) groupMap[prefix].done++;
      if (!isDone && target && target < today) groupMap[prefix].overdue++;
      if (urgency) groupMap[prefix].focus++;
    });

    var urgencyOrder = { overdue: 0, today: 1, soon: 2, high: 3 };
    focusTasks.sort(function(a, b) { return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]; });

    var groups = Object.values(groupMap).sort(function(a, b) {
      return b.overdue - a.overdue || b.focus - a.focus || a.prefix.localeCompare(b.prefix);
    });

    var prefixes = Object.keys(groupMap).filter(function(p) { return p !== 'Uncategorized'; }).sort();

    res.render('index', {
      title: 'Goal Post',
      focusTasks: focusTasks,
      groups: groups,
      prefixes: prefixes
    });
  });
});

module.exports = router;
