var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST
    multer = require('multer');
    fs = require('fs');

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
    //GET all tasks
    .get(function(req, res, next) {
        //retrieve all tasks from Monogo
        mongoose.model('Task').find({}, function (err, tasks) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
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
    })
    //POST a new task
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        console.log(req.body); //should be all the text
        console.log(req.files); //should be all the files

        //save the image
        var tmp_path = req.files.img.path;
        var target_path = './public/images/' + req.files.img.name;

        fs.rename(tmp_path, target_path, function(err) {
          if (err) throw err;
          // res.send('File uploaded to: ' + target_path + ' - ' + req.files.img.size + 'bytes');
        });

        var catprefix = req.body.catprefix;
        var idincat = req.body.idincat;
        var title = req.body.title;
        var description = req.body.description;
        // var created = req.body.created;
        var created = new Date();
        var updated = req.body.updated;
        var completed = req.body.completed;
        var status = req.body.status;
        var progress = req.body.progress;
        var priority = req.body.priority;
        var difficulty = req.body.difficulty;
        var img = req.files.img.name;
        // TODO: loop through all images

        //call the create function for our database
        mongoose.model('Task').create({
            catprefix : catprefix,
            idincat : idincat,
            title : title,
            description : description,
            created : created,
            updated : updated,
            completed : completed,
            status : status,
            progress : progress,
            priority : priority,
            difficulty : difficulty,
            img : img
            // TODO: loop through all images
        }, function (err, task) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  //Task has been created
                  console.log('POST creating new task: ' + task);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("tasks");
                        // And forward to success page
                        res.redirect("/tasks");
                    },
                    //JSON response will show the newly created task
                    json: function(){
                        res.json(task);
                    }
                });
              }
        })
    });

/* GET New Task page. */
router.get('/new', function(req, res) {
    res.render('tasks/new', { title: 'Add New Task' });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Task').findById(id, function (err, task) {
        //if it isn't found, we are going to repond with 404
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
});

router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Task').findById(req.id, function (err, task) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + task._id);
        console.log('For task: ' + task);
        var taskcreated = task.created.toISOString();
        taskcreated = taskcreated.substring(0, taskcreated.indexOf('T'))
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
    });
  });

router.route('/:id/edit')
	//GET the individual task by Mongo ID
	.get(function(req, res) {
	    //search for the task within Mongo
	    mongoose.model('Task').findById(req.id, function (err, task) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {
	            //Return the task
	            console.log('GET Retrieving ID: ' + task._id);
              var taskcreated = task.created.toISOString();
              taskcreated = taskcreated.substring(0, taskcreated.indexOf('T'))
	            res.format({
	                //HTML response will render the 'edit.jade' template
	                html: function(){
	                       res.render('tasks/edit', {
	                          title: 'Task' + task._id,
                            "taskcreated" : taskcreated,
	                          "task" : task
	                      });
	                 },
	                 //JSON response will return the JSON output
	                json: function(){
	                       res.json(task);
	                 }
	            });
	        }
	    });
	})
	//PUT to update a task by ID
	.put(function(req, res) {
	    // Get our REST or form values. These rely on the "name" attributes
	    var catprefix = req.body.catprefix;
      var idincat = req.body.idincat;
      var title = req.body.title;
      var description = req.body.description;
      var created = req.body.created;
      var updated = req.body.updated;
      var completed = req.body.completed;
      var status = req.body.status;
      var progress = req.body.progress;
      var priority = req.body.priority;
      var difficulty = req.body.difficulty;
      var img = req.files.img.name;
      // TODO: loop through all images

	    //find the document by ID
	    mongoose.model('Task').findById(req.id, function (err, task) {
	        //update it
	        task.update({
	            catprefix : catprefix,
              idincat : idincat,
              title : title,
              description : description,
              created : created,
              updated : updated,
              completed : completed,
              status : status,
              progress : progress,
              priority : priority,
              difficulty : difficulty,
              img : img.name
              // TODO: loop through all images
	        }, function (err, taskID) {
	          if (err) {
	              res.send("There was a problem updating the information to the database: " + err);
	          } 
	          else {
	                  //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
	                  res.format({
	                      html: function(){
	                           res.redirect("/tasks/" + task._id);
	                     },
	                     //JSON responds showing the updated values
	                    json: function(){
	                           res.json(task);
	                     }
	                  });
	           }
	        })
	    });
	})
	//DELETE a Task by ID
	.delete(function (req, res){
	    //find task by ID
	    mongoose.model('Task').findById(req.id, function (err, task) {
	        if (err) {
	            return console.error(err);
	        } else {
	            //remove it from Mongo
	            task.remove(function (err, task) {
	                if (err) {
	                    return console.error(err);
	                } else {
	                    //Returning success messages saying it was deleted
	                    console.log('DELETE removing ID: ' + task._id);
	                    res.format({
	                        //HTML returns us back to the main page, or you can create a success page
	                          html: function(){
	                               res.redirect("/tasks");
	                         },
	                         //JSON returns the item with the message that is has been deleted
	                        json: function(){
	                               res.json({message : 'deleted',
	                                   item : task
	                               });
	                         }
	                      });
	                }
	            });
	        }
	    });
	});

module.exports = router;