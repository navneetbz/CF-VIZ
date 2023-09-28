var dark = false;
var api_url = "https://codeforces.com/api/";

var username = "";
var verdicts = {};
var langs = {};
var tags = {};
var levels = {};
var ratings = {};
var problems = {};
var totalSub = 0;
var heatmap = {};
var heatmapData = {};
var years = 0;

const loader = document.getElementById("loader")
loader.style.display = "none"

var titleTextStyle = {
  fontSize: 18,
  color: "#393939",
  bold: false,
};

// TODO: BREAK THIS FUNCTION INTO IDK.. MORE FUNCTIONS?
async function handleSubmit(e) {
  e.preventDefault();
  loader.style.display = "block"
  username = "";
  verdicts = {};
  langs = {};
  tags = {};
  levels = {};
  ratings = {};
  problems = {};
  totalSub = 0;
  heatmap = {};
  heatmapData = {};
  years = 0;

  try {
    username = input.value.trim();
    console.log("username", username);

    let res = await fetch(`${api_url}user.status?handle=${username}`);
    res = await res.json();

    // TODO: ALSO THIS LOOP IF FROM THE ACTUAL CF VIZ CODE BASE, WORKS FINE BUT LOOKS LIKE SOME OPTIMIZATIONS CAN BE DONE TO IT..
    for (var i = res.result.length - 1; i >= 0; i--) {
      var sub = res.result[i];

      // creating unique key for problem {contestID + problem name + problem rating}
      var rating;
      if (sub.problem.rating === undefined) {
        rating = 0;
      } else {
        rating = sub.problem.rating;
      }

      var problemId =
        sub.problem.contestId + "-" + sub.problem.name + "-" + rating;

      // previous id for removing duplicates
      var problemIdprev =
        sub.problem.contestId - 1 + "-" + sub.problem.name + "-" + rating;

      // next id for removing duplicates
      var problemIdnext =
        sub.problem.contestId + 1 + "-" + sub.problem.name + "-" + rating;

      // checking if problem previously visited
      if (problems[problemIdprev] !== undefined) {
        if (problems[problemIdprev].solved === 0) {
          problems[problemIdprev].attempts++;
        }
        problemId = problemIdprev;
      } else if (problems[problemIdnext] !== undefined) {
        if (problems[problemIdnext].solved === 0) {
          problems[problemIdnext].attempts++;
        }
        problemId = problemIdnext;
      } else if (problems[problemId] !== undefined) {
        if (problems[problemId].solved === 0) {
          problems[problemId].attempts++;
        }
      } else {
        problems[problemId] = {
          problemlink: sub.contestId + "-" + sub.problem.index, // link of problem
          attempts: 1,
          solved: 0, // We also want to save how many submission got AC, a better name would have been number_of_ac
        };
      }

      if (sub.verdict == "OK") {
        problems[problemId].solved++;
      }

      // modifying level, rating, and tag counter on first AC.
      if (problems[problemId].solved === 1 && sub.verdict == "OK") {
        sub.problem.tags.forEach(function (t) {
          if (tags[t] === undefined) tags[t] = 1;
          else tags[t]++;
        });

        if (levels[sub.problem.index[0]] === undefined)
          levels[sub.problem.index[0]] = 1;
        else levels[sub.problem.index[0]]++;

        if (sub.problem.rating) {
          if (ratings[sub.problem.rating] === undefined) {
            ratings[sub.problem.rating] = 1;
          } else {
            ratings[sub.problem.rating]++;
          }
        }
      }

      // changing counter of verdict submission
      if (verdicts[sub.verdict] === undefined) verdicts[sub.verdict] = 1;
      else verdicts[sub.verdict]++;

      // changing counter of launguage submission
      if (langs[sub.programmingLanguage] === undefined)
        langs[sub.programmingLanguage] = 1;
      else langs[sub.programmingLanguage]++;

      //updating the heatmap
      var date = new Date(sub.creationTimeSeconds * 1000); // submission date
      date.setHours(0, 0, 0, 0);
      if (heatmap[date.valueOf()] === undefined) heatmap[date.valueOf()] = 1;
      else heatmap[date.valueOf()]++;
      totalSub = res.result.length;

      // how many years are there between first and last submission
      years =
        new Date(res.result[0].creationTimeSeconds * 1000).getYear() -
        new Date(
          res.result[res.result.length - 1].creationTimeSeconds * 1000
        ).getYear();
      years = Math.abs(years) + 1;
    }

    drawVerdictChart();
    drawLangChart();
    drawTagChart();
    drawLevelChart();
    drawProblemRatingsChart();
    drawHeatmap()

    console.log(
      "verdict",
      verdicts,
      "langs",
      langs,
      "tags",
      tags,
      " levels",
      levels,
      "ratings",
      ratings,
      "problems",
      problems,
      "totalSub",
      totalSub,
      "heatmap",
      heatmap,
      "heatmapData",
      heatmapData,
      "years",
      years
    );
  } catch (err) {
    console.error(err);
  } finally {
    // resetForm();
    loader.style.display = "none"
  }
  console.log("RUNNING");
}

// Get the form element by its ID
const form = document.getElementById("form");

const input = document.getElementById("username-input");

// Add a submit event listener to the form
form.addEventListener("submit", handleSubmit);

function setTheme() {
  let themeButton = document.getElementById("themeButton");
  if (dark) {
    dark = false;
    document.documentElement.setAttribute("data-bs-theme", "light");
    themeButton.innerHTML = `<i class="fas fa-moon fa-lg fa-fw"></i>`;
  } else {
    dark = true;
    document.documentElement.setAttribute("data-bs-theme", "dark");
    themeButton.innerHTML = `<i class="fas fa-sun fa-lg fa-fw"></i>`;
  }
}

function resetForm() {
  input.value = "";
}

document.getElementById("themeButton").addEventListener("click", function () {
  handleSubmit({ preventDefault: () => {} });
});

function drawVerdictChart() {
  const verdictDiv = document.getElementById("verdicts");
  verdictDiv.classList.remove("d-none");
  verdictDiv.classList.add("card");
  var verTable = [["Verdict", "Count"]];
  var verSliceColors = [];
  // beautiful names for the verdicts + colors
  for (var ver in verdicts) {
    if (ver == "OK") {
      verTable.push(["AC", verdicts[ver]]);
      verSliceColors.push({ color: "#FFC3A0" });
    } else if (ver == "WRONG_ANSWER") {
      verTable.push(["WA", verdicts[ver]]);
      verSliceColors.push({ color: "#FF677D" });
    } else if (ver == "TIME_LIMIT_EXCEEDED") {
      verTable.push(["TLE", verdicts[ver]]);
      verSliceColors.push({ color: "#D4A5A5" });
    } else if (ver == "MEMORY_LIMIT_EXCEEDED") {
      verTable.push(["MLE", verdicts[ver]]);
      verSliceColors.push({ color: "#392F5A" });
    } else if (ver == "RUNTIME_ERROR") {
      verTable.push(["RTE", verdicts[ver]]);
      verSliceColors.push({ color: "#31A2AC" });
    } else if (ver == "COMPILATION_ERROR") {
      verTable.push(["CPE", verdicts[ver]]);
      verSliceColors.push({ color: "#61C0BF" });
    } else if (ver == "SKIPPED") {
      verTable.push(["SKIPPED", verdicts[ver]]);
      verSliceColors.push({ color: "#6B4226" });
    } else if (ver == "CLALLENGED") {
      verTable.push(["CLALLENGED", verdicts[ver]]);
      verSliceColors.push({ color: "#D9BF77" });
    } else {
      verTable.push([ver, verdicts[ver]]);
      verSliceColors.push({});
    }
  }
  verdicts = new google.visualization.arrayToDataTable(verTable);
  var verOptions = {
    height: verdictDiv.getBoundingClientRect().width,
    title: "Verdicts of " + username,
    legend: "none",
    pieSliceText: "label",
    slices: verSliceColors,
    fontName: "Menlo",
    backgroundColor: dark ? "#212529" : "white",
    titleTextStyle: { color: !dark ? "#212529" : "white" },
    legend: {
      textStyle: {
        color: !dark ? "#212529" : "white",
      },
    },
    is3D: true,
  };
  var verChart = new google.visualization.PieChart(verdictDiv);
  verChart.draw(verdicts, verOptions);
}

const colors = [
  "#FFC3A0",
  "#FF677D",
  "#D4A5A5",
  "#392F5A",
  "#31A2AC",
  "#61C0BF",
  "#6B4226",
  "#D9BF77",
  "#ACD8AA",
  "#FFE156",
  "#8F2D56",
  "#663F46",
  "#1E1E24",
  "#6B8E23",
  "#5C2A9D",
  "#AA4B6B",
  "#4B3F72",
  "#FFB997",
  "#7D84B2",
  "#5F758E",
  "#FFD4C4",
  "#E5E5E5",
];

function drawLangChart() {
  const langDiv = document.getElementById("langs");
  langDiv.classList.remove("d-none");
  langDiv.classList.add("card");
  var langTable = [["Language", "Count"]];
  for (var lang in langs) {
    langTable.push([lang, langs[lang]]);
  }
  langs = new google.visualization.arrayToDataTable(langTable);

  var langOptions = {
    height: langDiv.getBoundingClientRect().width,
    title: "Languages of " + username,
    legend: "none",
    pieSliceText: "label",
    fontName: "Menlo",
    backgroundColor: dark ? "#212529" : "white",
    titleTextStyle: { color: !dark ? "#212529" : "white" },
    legend: {
      textStyle: {
        color: !dark ? "#212529" : "white",
      },
    },
    is3D: true,
    colors: colors.slice(0, Math.min(colors.length, langs.getNumberOfRows())),
  };
  var langChart = new google.visualization.PieChart(langDiv);
  langChart.draw(langs, langOptions);
}

function drawTagChart() {
  const tagsDiv = document.getElementById("tags");
  tagsDiv.classList.remove("d-none");
  var tagTable = [];
  for (var tag in tags) {
    tagTable.push([tag + ": " + tags[tag], tags[tag]]);
  }
  tagTable.sort(function (a, b) {
    return b[1] - a[1];
  });
  tags = new google.visualization.DataTable();
  tags.addColumn("string", "Tag");
  tags.addColumn("number", "solved");
  tags.addRows(tagTable);
  var tagOptions = {
    width: Math.max(600, tagsDiv.getBoundingClientRect().width),
    height: Math.max(600, tagsDiv.getBoundingClientRect().width) * 0.3,
    chartArea: { width: "80%", height: "70%" },
    title: "Tags of " + username,
    pieSliceText: "none",
    legend: {
      position: "right",
      alignment: "center",
      textStyle: {
        fontSize: 12,
        fontName: "Menlo",
      },
    },
    pieHole: 0.5,
    tooltip: {
      text: "percentage",
    },
    fontName: "Menlo",
    backgroundColor: dark ? "#212529" : "white",
    titleTextStyle: { color: !dark ? "#212529" : "white" },
    legend: {
      textStyle: {
        color: !dark ? "#212529" : "white",
      },
    },
    colors: colors.slice(0, Math.min(colors.length, tags.getNumberOfRows())),
  };
  var tagChart = new google.visualization.PieChart(
    document.getElementById("tags")
  );
  tagChart.draw(tags, tagOptions);
}

function drawLevelChart() {
  const levelsDiv = document.getElementById("levels");
  levelsDiv.classList.remove("d-none");
  var levelTable = [];
  for (var level in levels) {
    levelTable.push([level, levels[level]]);
  }
  levelTable.sort(function (a, b) {
    if (a[0] > b[0]) return -1;
    else return 1;
  });
  levels = new google.visualization.DataTable();
  levels.addColumn("string", "Level");
  levels.addColumn("number", "solved");
  levels.addRows(levelTable);
  var levelOptions = {
    width: Math.max(
      levelsDiv.getBoundingClientRect().width,
      levels.getNumberOfRows() * 50
    ),
    height: 300,
    title: "Levels of " + username,
    legend: "none",
    fontName: "Menlo",
    backgroundColor: dark ? "#212529" : "white",
    titleTextStyle: { color: !dark ? "#212529" : "white" },
    legend: {
      textStyle: {
        color: !dark ? "#212529" : "white",
      },
    },
    vAxis: { format: "0" },
    colors: ["#AA4B6B"],
    is3D: true,
  };
  var levelChart = new google.visualization.ColumnChart(levelsDiv);
  if (levelTable.length > 1) levelChart.draw(levels, levelOptions);
}

function drawProblemRatingsChart() {
  //Plotting ratings
  const ratingsDiv = document.getElementById("ratings");
  ratingsDiv.classList.remove("d-none");
  var ratingTable = [];
  for (var rating in ratings) {
    ratingTable.push([rating, ratings[rating]]);
  }
  ratingTable.sort(function (a, b) {
    if (parseInt(a[0]) > parseInt(b[0])) return -1;
    else return 1;
  });
  ratings = new google.visualization.DataTable();
  ratings.addColumn("string", "Rating");
  ratings.addColumn("number", "solved");
  ratings.addRows(ratingTable);
  var ratingOptions = {
    width: Math.max(
      ratingsDiv.getBoundingClientRect().width,
      ratings.getNumberOfRows() * 50
    ),
    height: 300,
    title: "Problem ratings of " + username,
    legend: "none",
    fontName: "Menlo",
    backgroundColor: dark ? "#212529" : "white",
    titleTextStyle: { color: !dark ? "#212529" : "white" },
    legend: {
      textStyle: {
        color: !dark ? "#212529" : "white",
      },
    },
    vAxis: { format: "0" },
    colors: ["#663F46"],
  };
  var ratingChart = new google.visualization.ColumnChart(ratingsDiv);
  if (ratingTable.length > 1) ratingChart.draw(ratings, ratingOptions);
}

function drawHeatmap() {
  const heatMapDiv = document.getElementById("heatmap");
  const chartContainerDiv = document.getElementById("chartContainer")
  const heatMapHandleSpan = document.getElementById("heatMapHandle")
  chartContainerDiv.classList.remove("d-none");
  heatMapHandleSpan.innerHTML = username;
  var heatmapTable = [];
  for (var d in heatmap) {
    heatmapTable.push([new Date(parseInt(d)), heatmap[d]]);
  }
  heatmapData = new google.visualization.DataTable();
  heatmapData.addColumn({ type: "date", id: "Date" });
  heatmapData.addColumn({ type: "number", id: "Submissions" });
  heatmapData.addRows(heatmapTable);

  heatmap = new google.visualization.Calendar(heatMapDiv);
  var heatmapOptions = {
    height: years * 140 + 30,
    width: Math.max(heatMapDiv.getBoundingClientRect().width, 900),
    fontName: "Menlo",
    backgroundColor: dark ? "#212529" : "white",
    titleTextStyle: { color: !dark ? "#212529" : "white" },
    legend: {
      textStyle: {
        color: !dark ? "#212529" : "white",
      },
    },
    colorAxis: {
      minValue: 0,
      colors: ["#ffffff", "#0027ff", "#00127d"],
    },
    calendar: {
      cellSize: 15,
    },
  };
  heatmap.draw(heatmapData, heatmapOptions);
}
