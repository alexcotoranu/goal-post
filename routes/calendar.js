const express = require("express"),
  moment = require("moment"),
  router = express.Router(),
  fetch = require("isomorphic-fetch"),
  request = require("request"),
  http = require("http");

var arrayToSend = [];

/* GET calendar page. */
router.route("/:year/:month").get((req, res) => {
  //AJAX call
  getTasks = async () => {
    try {
      //task API options
      var url = "http://localhost:5000/tasks/";
      var options = {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      };
      const response = await fetch(url, options);
      const body = await response.json();
      return body;
      // resolve(JSON.parse(body));
    } catch (err) {
      throw err; // TypeError: failed to fetch
    }
  };

  getDays = (providedYear, providedMonth) => {
    //calculate the last day in a given month
    var lastDay = new Date(providedYear, providedMonth, 0).getDate();
    //provide a second digit for single digit days i.e. 2 -> 02
    if (lastDay < 10) {
      lastDay = "0" + lastDay;
    }

    var firstDate = moment(providedYear + "-" + providedMonth + "-01T00:00:00");
    var lastDate = moment(
      providedYear + "-" + providedMonth + "-" + lastDay + "T23:59:59"
    );

    var weekDays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

    // var weekDays = moment.weekdays();

    var calDays = [];

    for (var m = firstDate; m.isBefore(lastDate); m.add(1, "days")) {
      var firstDay = firstDate.format("E"),
        date = m.format("YYYY-MM-DD"),
        year = m.format("YYYY"),
        month = m.format("MM"),
        day = m.format("DD"),
        weekday = weekDays[m.day()],
        week = m.isoWeek();
      calDays[Number(day)] = {week, weekday, date, day, month, year};
    }

    return calDays;
  };
  
  getTasks().then(tasks => {
    //map each day for the month being requested for
    const taskDays = getDays(req.params.year, req.params.month).map(day => {
      // var tempTaskDays = [];
      var tempTaskDay = day;
      tempTaskDay.tasks = {};
      // if a task's startdate is defined and it coincides with this day
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].startdate && tasks[i].startdate === day.date) {
          // add the task to this day
          tempTaskDay.tasks[i] = tasks[i];
          // console.log(tempTaskDays);
        }
      }
      return tempTaskDay;
      //TODO: figure out what is causing the first entry to be empty
    });

    var taskWeeks = taskDays.reduce( (acc, taskDay)=> {
      
      // check if the week number exists
      if (typeof acc[taskDay.week] === 'undefined') {
        acc[taskDay.week] = [];
      }
      
      acc[taskDay.week].push(taskDay);
      
      return acc;
    
    }, {});

    console.log(taskWeeks);

    JSON.stringify(taskWeeks);
    // console.log(taskDays);

    res.format({
      html: () => {
        res.render("calendar", {
          // cal: getTheseDays()
          cal: taskWeeks
        });
      },
      json: () => {
        // res.json(getTheseDays());
        // res.json(main());
      }
    });
  });

});

module.exports = router;
