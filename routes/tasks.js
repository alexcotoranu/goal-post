var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override');
    fs = require('fs');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function padId(n) {
  return String(n).padStart(3, '0');
}

function nextSeq(prefix, cb) {
  mongoose.model('Counter').findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
    cb
  );
}

function applyProgressDates(fields) {
  if (fields.progress == 100) {
    fields.completed = new Date();
  } else if ('progress' in fields) {
    fields.completed = null;
  }
}

function saveUpload(req) {
  if (req.files && req.files.img) {
    var tmp = req.files.img.path;
    var target = './public/images/' + req.files.img.name;
    fs.rename(tmp, target, function(err) { if (err) console.error(err); });
    return req.files.img.name;
  }
  return null;
}

function annotateUrgency(task) {
  var today = new Date(); today.setHours(0,0,0,0);
  var in3 = new Date(today); in3.setDate(in3.getDate() + 3);
  var target = task.target ? new Date(task.target) : null;
  if (target) target.setHours(0,0,0,0);
  var isDone = !!task.completed;
  var urgency = null;
  if (!isDone && target) {
    if (target < today) urgency = 'overdue';
    else if (target.getTime() === today.getTime()) urgency = 'today';
    else if (target <= in3 && task.priority >= 3) urgency = 'soon';
  }
  if (!isDone && !urgency && task.priority >= 4) urgency = 'high';
  var daysUntil = (target && !isDone) ? Math.round((target - today) / 86400000) : null;
  return {
    task: task,
    urgency: urgency,
    daysUntil: daysUntil,
    targetStr: target ? target.toISOString().substring(0, 10) : null
  };
}

// ── POST / (create) ──────────────────────────────────────────────────────────

router.route('/')
  .get(function(req, res, next) {
    mongoose.model('Task').find({}, function(err, tasks) {
      if (err) return next(err);
      res.format({
        html: function() { res.render('tasks/index', { title: 'All Tasks', tasks: tasks }); },
        json: function() { res.json(tasks); }
      });
    });
  })
  .post(function(req, res, next) {
    var body = req.body;
    var img = saveUpload(req);
    var catprefix = (body.catprefix || 'TASK').trim().toUpperCase();

    nextSeq(catprefix, function(err, counter) {
      if (err) return next(err);

      var fields = {};
      for (var k in body) fields[k] = body[k];
      fields.catprefix = catprefix;
      fields.idincat = counter.seq;
      fields.created = new Date();
      if (img) fields.img = img;
      applyProgressDates(fields);

      mongoose.model('Task').create(fields, function(err, task) {
        if (err) return res.send('Error adding task: ' + err);
        res.format({
          html: function() { res.redirect('/tasks/' + task._id); },
          json: function() { res.json(task); }
        });
      });
    });
  });

// ── POST /quick (post-it style) ───────────────────────────────────────────────

router.post('/quick', function(req, res, next) {
  var title = (req.body.title || '').trim();
  var catprefix = (req.body.catprefix || 'TASK').trim().toUpperCase();
  var redirectTo = req.body.redirectTo || '/';

  if (!title) return res.redirect(redirectTo);

  nextSeq(catprefix, function(err, counter) {
    if (err) return next(err);
    mongoose.model('Task').create({
      title: title,
      catprefix: catprefix,
      idincat: counter.seq,
      created: new Date(),
      status: 'backlog',
      progress: 0
    }, function(err) {
      if (err) return next(err);
      res.redirect(redirectTo);
    });
  });
});

// ── GET /new ──────────────────────────────────────────────────────────────────

router.get('/new', function(req, res, next) {
  mongoose.model('Task').distinct('catprefix', function(err, prefixes) {
    prefixes = (prefixes || []).filter(Boolean).sort();
    res.render('tasks/new', { title: 'New Task', prefixes: prefixes });
  });
});

// ── GET /group/:prefix ────────────────────────────────────────────────────────

router.get('/group/:prefix', function(req, res, next) {
  var prefix = req.params.prefix;
  var query = prefix === 'Uncategorized'
    ? { $or: [{ catprefix: null }, { catprefix: '' }, { catprefix: { $exists: false } }] }
    : { catprefix: prefix };

  mongoose.model('Task').find(query, function(err, tasks) {
    if (err) return next(err);

    var urgencyOrder = { overdue: 0, today: 1, soon: 2, high: 3 };
    var annotated = tasks.map(annotateUrgency).sort(function(a, b) {
      if (a.task.completed && !b.task.completed) return 1;
      if (!a.task.completed && b.task.completed) return -1;
      if (a.urgency && !b.urgency) return -1;
      if (!a.urgency && b.urgency) return 1;
      if (a.urgency && b.urgency && a.urgency !== b.urgency)
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (a.daysUntil !== null && b.daysUntil !== null) return a.daysUntil - b.daysUntil;
      return (b.task.priority || 0) - (a.task.priority || 0);
    });

    res.render('tasks/group', { title: prefix + ' Tasks', prefix: prefix, tasks: annotated });
  });
});

// ── :id param validation ──────────────────────────────────────────────────────

router.param('id', function(req, res, next, id) {
  mongoose.model('Task').findById(id, function(err, task) {
    if (err) {
      res.status(404);
      var e = new Error('Not Found'); e.status = 404;
      return res.format({
        html: function() { next(e); },
        json: function() { res.json({ message: '404 Not Found' }); }
      });
    }
    req.id = id;
    next();
  });
});

// ── GET/DELETE /:id ───────────────────────────────────────────────────────────

router.route('/:id')
  .get(function(req, res, next) {
    mongoose.model('Task').findById(req.id, function(err, task) {
      if (err) return next(err);
      var today = new Date(); today.setHours(0,0,0,0);
      var target = task.target ? new Date(task.target) : null;
      if (target) target.setHours(0,0,0,0);
      var daysUntil = (target && !task.completed) ? Math.round((target - today) / 86400000) : null;
      res.format({
        html: function() {
          res.render('tasks/show', {
            task: task,
            createdStr: task.created ? task.created.toISOString().substring(0, 10) : '',
            targetStr:  target ? target.toISOString().substring(0, 10) : '',
            completedStr: task.completed ? task.completed.toISOString().substring(0, 10) : '',
            daysUntil: daysUntil,
            padId: padId
          });
        },
        json: function() { res.json(task); }
      });
    });
  })
  .delete(function(req, res, next) {
    mongoose.model('Task').findById(req.id, function(err, task) {
      if (err) return next(err);
      task.remove(function(err) {
        if (err) return next(err);
        res.format({
          html: function() { res.redirect('/'); },
          json: function() { res.json({ message: 'deleted', item: task }); }
        });
      });
    });
  });

// ── GET/PUT /:id/edit ─────────────────────────────────────────────────────────

router.route('/:id/edit')
  .get(function(req, res, next) {
    mongoose.model('Task').findById(req.id, function(err, task) {
      if (err) return next(err);
      var target = task.target ? new Date(task.target) : null;
      mongoose.model('Task').distinct('catprefix', function(err2, prefixes) {
        prefixes = (prefixes || []).filter(Boolean).sort();
        res.format({
          html: function() {
            res.render('tasks/edit', {
              title: 'Edit Task',
              task: task,
              targetStr: target ? target.toISOString().substring(0, 10) : '',
              prefixes: prefixes,
              padId: padId
            });
          },
          json: function() { res.json(task); }
        });
      });
    });
  })
  .put(function(req, res, next) {
    var body = req.body;
    var img = saveUpload(req);

    var fields = {};
    for (var k in body) fields[k] = body[k];
    if (img) fields.img = img;
    fields.updated = new Date();
    applyProgressDates(fields);

    mongoose.model('Task').findById(req.id, function(err, task) {
      if (err) return next(err);
      task.update(fields, function(err) {
        if (err) return res.send('Error updating: ' + err);
        res.format({
          html: function() { res.redirect('/tasks/' + task._id); },
          json: function() { res.json(task); }
        });
      });
    });
  });

module.exports = router;
