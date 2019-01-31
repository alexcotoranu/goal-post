var express = require('express'),
    router = express.Router(),
    r = require('rethinkdb'); //rethinkdb (js driver) connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'), //used to manipulate POST
    multer = require('multer'); // used to upload files

module.exports = router;