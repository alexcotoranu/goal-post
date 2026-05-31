var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var COLUMNS = [
  { id: 'backlog',    label: 'Backlog',     count: 0 },
  { id: 'inprogress', label: 'In Progress', count: 0 },
  { id: 'review',    label: 'Review',       count: 0 },
  { id: 'done',      label: 'Done',         count: 0 }
];

function classify(task) {
  if (task.completed || task.progress === 100) return 'done';
  var s = (task.status || '').toLowerCase().replace(/[-_\s]/g, '');
  if (['review', 'testing', 'blocked'].indexOf(s) !== -1) return 'review';
  if (['inprogress', 'doing', 'wip', 'started'].indexOf(s) !== -1) return 'inprogress';
  if (task.progress > 0) return 'inprogress';
  return 'backlog';
}

router.get('/', function(req, res, next) {
  mongoose.model('Task').find({}, function(err, tasks) {
    if (err) return next(err);

    var today = new Date(); today.setHours(0, 0, 0, 0);

    var cols = { backlog: [], inprogress: [], review: [], done: [] };

    tasks.forEach(function(task) {
      var target = task.target ? new Date(task.target) : null;
      if (target) target.setHours(0, 0, 0, 0);
      cols[classify(task)].push({
        task: task,
        isOverdue: !task.completed && target && target < today,
        targetStr: target ? target.toISOString().substring(0, 10) : null
      });
    });

    var columns = COLUMNS.map(function(c) {
      return { id: c.id, label: c.label, cards: cols[c.id] };
    });

    res.render('board/index', { title: 'Board', columns: columns });
  });
});

module.exports = router;
