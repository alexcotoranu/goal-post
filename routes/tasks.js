var express = require('express'),
    router = express.Router(),
    r = require('rethinkdb'); //rethinkdb (js driver) connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST
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
}))

//build the REST operations at the base for tasks
//this will be accessible from http://127.0.0.1:3000/tasks if the default route for / is left unchanged
router.route('/')
    .get(function(req, res, next) {
        /* GET all tasks */
        r.table('tasks').run(connection, function(err, cursor) {
            if (err) throw err;
            cursor.toArray(function(err, result) {
                if (err) {
                    throw err;
                } else {
                    //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                    // console.log(tasks);
                    console.log(JSON.stringify(result, null, 2));
                    var tasks = result;
                    res.format({
                        //HTML response will render the index.jade file in the views/tasks folder. We are also setting "tasks" to be an accessible variable in our jade view
                        html: function(){
                            res.render('tasks/index', {
                                title: 'All my Tasks',
                                "tasks" : tasks
                            });
                        },
                        //JSON response will show all tasks in JSON format
                        json: function(){
                            res.json(infophotos);
                        }
                    });
                }
            });
        });
    })
    .post(function(req, res) {
        /* POST new task */
        console.log(req.body); //should be all the text
        // console.log(req.files); //should be all the files

        var changedFields = {};

        for (var name in req.body) {
            console.log("-------------");
            console.log(name + ": " + req.body[name]);
            changedFields[name] = req.body[name];
            if (name == 'progress' && req.body[name] == '100'){
                changedFields.completed = new Date();
            } else if (name == 'progress' && req.body[name] !== '100') {
                changedFields.completed = null;
            }
        }

        //add the date for creation
        changedFields.created = new Date();

        console.log(changedFields);

        r.table('tasks').insert(changedFields).run(connection, function(err, cursor)
        {
            if (err) {
                throw err;
            } else {
                console.log(cursor);
                //Task has been created
                res.format({
                    //HTML response will set the location and redirect back to the home page.
                    'text/html': function(){
                         // If it worked, set the header so the address bar doesn't still say /adduser
                         res.location("tasks");
                         // And forward to success page
                         res.redirect("/tasks");
                    },
                    //JSON response will show the newly created task
                    'application/json': function(){
                        res.json(cursor);
                    }
                });
            }
        });
    });

/* GET new task form */
router.get('/new', function(req, res) {
    res.render('tasks/new', { title: 'Add New Task' });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    // find the ID in the database
    r.table('tasks').get(req.params.id).run(connection, function(err, task) {
        // if (err) throw err;
        // console.log(callback);
        // cursor.toArray(function(err, result) {
            if (err) {
                console.log(id + ' was not found');
                res.status(404)
                var err = new Error('Not Found');
                err.status = 404;
                res.format({
                    html: function(){
                        next(err);
                    },
                    json: function(){
                        res.json({message : err.status  + ' ' + err});
                    }
                });
            //if it is found we continue on
            } else {
                //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
                console.log(task);
                // once validation is done save the new item in the req
                req.id = id;
                // go to the next thing
                next();
            }
        });
    // });
});

/* GET individual task */
router.route('/:id')
    .get(function(req, res) {
        console.log(req.params.id);
        //individual task will be loaded here
        r.table('tasks').get(req.params.id).run(connection, function(err, task) {
            // if (err) throw err;
            // cursor.toArray(function(err, task) {
                if (err) {
                    throw err;
                } else {
                    console.log('For task: ' + task);
                    var taskcreated = task.created.toISOString();
                    taskcreated = taskcreated.substring(0, taskcreated.indexOf('T'));
                    res.format({
                        html: function(){
                            res.render('tasks/show', {
                                "taskcreated" : taskcreated,
                                "task" : task
                            });
                        },
                        json: function(){
                            res.json(task);
                        }
                    });
                }
            // });
        });
    });

/* Edit existing task */
router.route('/:id/edit')
    .get(function(req, res) {
       //individual task will be loaded here 
    })
    .put(function(req, res) {
        //individual task will be updated here
    })
    .delete(function (req, res){
        // delete a specific task
    });

module.exports = router;
