var mongoose = require('mongoose');
var taskSchema = new mongoose.Schema({
	catprefix: String,
	idincat: Number,
	title: String,
	description: String,
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now },
	completed: { type: Date, default: Date.now },
	status: String,
	progress: Number,
	priority: Number,
	difficulty: String,
	img: String
	// TODO: make this an array that can take any number of images
});
mongoose.model('Task', taskSchema);