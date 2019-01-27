var express = require('express'),
    router = express.Router(),
    r = require('rethinkdb'); //rethinkdb (js driver) connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST
    multer = require('multer'); // used to upload files

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
        console.log(req.files); //should be all the files
    });

/* GET new task form */
router.get('/new', function(req, res) {
    res.render('tasks/new', { title: 'Add New Task' });
});




// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    // find the ID in the database
});

/* GET individual task */
router.route('/:id')
    .get(function(req, res) {
        //individual task will be loaded here
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
