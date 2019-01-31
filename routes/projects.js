var express = require('express'),
    router = express.Router(),
    r = require('rethinkdb'); //rethinkdb (js driver) connection
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

//build the REST operations at the base for projects
//this will be accessible from http://127.0.0.1:3000/projects if the default route for / is left unchanged
router.route('/')
    .get(function(req, res, next) {
        /* GET all projects */
        r.table('projects').run(connection, function(err, cursor) {
            if (err) throw err;
            cursor.toArray(function(err, result) {
                if (err) {
                    throw err;
                } else {
                    //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                    // console.log(projects);
                    console.log(JSON.stringify(result, null, 2));
                    var projects = result;
                    res.format({
                        //HTML response will render the index.pug file in the views/projects folder. We are also setting "projects" to be an accessible variable in our pug view
                        html: function(){
                            res.render('projects/index', {
                                title: 'All my projects',
                                "projects" : projects
                            });
                        },
                        //JSON response will show all projects in JSON format
                        json: function(){
                            res.json(infophotos);
                        }
                    });
                }
            });
        });
    })
    .post(function(req, res) {
        /* POST new project */
        // console.log(req.body); //should be all the text
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

        r.table('projects').insert(changedFields).run(connection, function(err, cursor)
        {
            if (err) {
                throw err;
            } else {
                console.log(cursor);
                //project has been created
                res.format({
                    //HTML response will set the location and redirect back to the home page.
                    'text/html': function(){
                         // If it worked, set the header so the address bar doesn't still say /adduser
                         res.location("projects");
                         // And forward to success page
                         res.redirect("/projects");
                    },
                    //JSON response will show the newly created project
                    'application/json': function(){
                        res.json(cursor);
                    }
                });
            }
        });
    });

/* GET new project form */
router.get('/new', function(req, res) {
    res.render('projects/new', { title: 'Add New project' });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    // find the ID in the database
    r.table('projects').get(req.params.id).run(connection, function(err, project) {
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
            console.log(project);
            // once validation is done save the new item in the req
            req.id = id;
            next();
        }
    });
});

/* GET individual project */
router.route('/:id')
    .get(function(req, res) {
        console.log(req.params.id);
        //an individual project will be loaded here
        r.table('projects').get(req.params.id).run(connection, function(err, project) {
            if (err) {
                throw err;
            } else {
                console.log('Validating project: ' + project.id);
                console.log(project.id);
                if (!project.created) {
                    project.created = new Date(); //hacky TODO: find a better solution
                }
                var projectcreated = project.created.toISOString();
                projectcreated = projectcreated.substring(0, projectcreated.indexOf('T'));
                r.table('tasks').filter(r.row('project').eq(project.id)).run(connection, function(err, cursor) {
                    if (err) throw err;
                    cursor.toArray(function(err, tasks) {
                        if (err) {
                            throw err;
                        } else {
                            res.format({
                                html: function(){
                                    res.render('projects/show', {
                                        "projectcreated" : projectcreated,
                                        "project" : project,
                                        "tasks" : tasks
                                    });
                                },
                                json: function(){
                                    res.json(project);
                                }
                            });   
                        }
                    });
                });
            }
        });
    });

/* Edit existing project */
router.route('/:id/edit')
    .get(function(req, res) {
        //individual project will be loaded here
        r.table('projects').get(req.params.id).run(connection, function(err, project) {
            if (err) {
                throw err;
            } else {
                console.log('Editing project: ' + project.id);
                console.log(project.id);
                if (!project.created) {
                    project.created = new Date(); //hacky TODO: find a better solution
                }
                var projectcreated = project.created.toISOString();
                projectcreated = projectcreated.substring(0, projectcreated.indexOf('T'));
                res.format({
                    html: function(){
                        res.render('projects/edit', {
                            "project" : project
                        });
                    },
                    json: function(){
                        res.json(project);
                    }
                });
            }
        });
    })
    .put(function(req, res) {
        //individual project will be updated here
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
        // console.log (changedFields);
        r.table('projects').get(req.params.id).update(changedFields).run(connection, function(err, callback)
        {
            if (err) {
                throw err;
            } else {
                //project has been updated
                res.format({
                    //HTML response will set the location and redirect back to the home page.
                    'text/html': function(){
                        console.log(req.params.id);
                         // If it worked, set the header so the address bar doesn't still say /adduser
                         res.location("projects/" + req.params.id);
                         // And forward to success page
                         res.redirect("/projects/" + req.params.id);
                    },
                    //JSON response will show the callback report of the updated project
                    'application/json': function(){
                        res.json(callback);
                    }
                });
            }
        });
    })
    .delete(function (req, res){
        // delete a specific project
        r.table('projects').get(req.params.id).delete().run(connection, function(err, callback)
        {
            if (err) {
                throw err;
            } else {
                //project has been deleted
                res.format({
                    //HTML response will set the location and redirect back to the home page.
                    'text/html': function(){
                        console.log(req.params.id);
                         // If it worked, set the header so the address bar doesn't still say /adduser
                         res.location("projects");
                         // And forward to success page
                         res.redirect("/projects/");
                    },
                    //JSON response will show the callback report of the updated project
                    'application/json': function(){
                        res.json(callback);
                    }
                });
            }
        });
    });

module.exports = router;
