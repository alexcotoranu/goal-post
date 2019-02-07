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
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ];

    var calDays = [];

    for (var m = firstDate; m.isBefore(lastDate); m.add(1, "days")) {
      var firstDay = firstDate.format("E"),
        date = m.format("YYYY-MM-DD"),
        year = m.format("YYYY"),
        month = m.format("MM"),
        day = m.format("DD"),
        weekday = weekDays[m.day()],
        calPos = Number(day) + Number(firstDay);
      calDays[Number(day)] = { calPos, weekday, date, day, month, year };
    }
    return calDays;
  };

  // listAllTasks = () => {
  //   var initializeGetTasks = getTasks();
  //   var taskList = initializeGetTasks.then(result => {
  //     return result;
  //   });
  //   return taskList;
  // };

  getTasks().then(tasks => {
    //map each day for the month being requested for
    const taskDays = getDays(req.params.year, req.params.month).map(day => {
      // var tempTaskDays = [];
      var tempTaskDays = day;
      // if a task's startdate is defined and it coincides with this day
      for (task in tasks) {
        if (tasks[task].startdate && tasks[task].startdate === day.date) {
          // add the task to this day
          tempTaskDays.task = tasks[task];
        }
      }
      //TODO: figure out what is causing the first entry to be empty
    });

    // JSON.stringify(taskDays);
    console.log(taskDays);

    res.format({
      html: () => {
        res.render("calendar", {
          // cal: getTheseDays()
          cal: taskDays
        });
      },
      json: () => {
        // res.json(getTheseDays());
        // res.json(main());
      }
    });
  });

  // getTheseDays = () => {
  //   var tasks = listAllTasks();
  //   // console.log(tasks);
  //   var taskDays = getDays(req.params.year, req.params.month).map(day => {
  //     // if a task's startdate is defined and it coincides with this day
  //     for (task in tasks) {
  //       if (tasks[task].startdate && tasks[task].startdate === day.date) {
  //         // add the task to this day
  //         day.task = tasks[task];
  //       }
  //     }
  //   });
  //   // console.log(taskDays);
  //   return taskDays;
  // };

  // console.log(getTheseDays());
});

module.exports = router;
