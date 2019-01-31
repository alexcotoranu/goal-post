var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer  = require('multer');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// var blobRouter = require('./routes/blobs');
var projectRouter = require('./routes/projects');
var taskRouter = require('./routes/tasks');
var calendarRouter = require('./routes/calendar');
var timelineRouter = require('./routes/timeline');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// TODO: multer for file uploads
// app.use(multer({ dest: './uploads/',
//  rename: function (fieldname, filename) {
//     return filename+Date.now();
//   },
//   onFileUploadStart: function (file) {
//     console.log(file.originalname + ' is starting ...')
//   },
//   onFileUploadComplete: function (file) {
//     console.log(file.fieldname + ' uploaded to  ' + file.path)
//     done=true;
// }
// }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
// app.use('/blobs', blobRouter);
app.use('/projects', projectRouter);
app.use('/tasks', taskRouter);
app.use('/calendar', calendarRouter);
app.use('/timeline', timelineRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
