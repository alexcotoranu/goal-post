const express = require("express"),
  moment = require("moment"),
  router = express.Router(),
  fetch = require("isomorphic-fetch"),
  request = require("request"),
  http = require("http");

/* GET calendar page. */
router.route("/:year/:month").get((req, res) => {
  //task API options
  var url = "http://localhost:5000/tasks/";
  var options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  };

  getTasks = async () => {
    const response = await fetch(url, options);
    const tasks = await response.json();

    // TODO
    getDays(req.params.year, req.params.month).map(day => {
      for (var i = 0; i < tasks.length; i++) {
        // // console.log(tasks[i].startdate);
        // if (tasks[i].startdate && tasks[i].startdate == day.date) {
        //   day.task = tasks[task];
        //   console.log("Updated Day Object: " + day.date);
        //   console.log(day);
        // }
      }
      for (task in tasks) {
        if (tasks[task].startdate && tasks[task].startdate === day.date) {
          day.task = tasks[task];
          // console.log(day);
        }
      }
      return days;
    });
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

    var calDays = [];

    for (var m = firstDate; m.isBefore(lastDate); m.add(1, "days")) {
      var firstDay = firstDate.format("E"),
        date = m.format("YYYY-MM-DD"),
        year = m.format("YYYY"),
        month = m.format("MM"),
        day = m.format("DD"),
        calPos = Number(day) + Number(firstDay);
      // calDays["day" + dayInCal] = dayInMonth;
      calDays[Number(day)] = { calPos, date, day, month, year };
    }
    return calDays;
  };

  // console.log(calDays);
  res.format({
    html: () => {
      res.render("calendar", {
        cal: getTasks()
      });
    },
    json: () => {
      res.json(calDays);
    }
  });
});

module.exports = router;
