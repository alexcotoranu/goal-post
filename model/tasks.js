var mongoose = require('mongoose');
var taskSchema = new mongoose.Schema({
	catprefix: String,
	idincat: Number,
	title: String,
	description: String,
	created: { type: Date },
	target: { type: Date },
	updated: { type: Date },
	completed: { type: Date },
	status: String,
	progress: Number,
	priority: Number,
	difficulty: String,
	img: String
	// TODO: make this an array that can take any number of images
});
mongoose.model('Task', taskSchema);