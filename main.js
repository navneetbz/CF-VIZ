var dark = false
var api_url = "https://codeforces.com/api/"

var username = ""
var verdicts = {}
var langs = {}
var tags = {}
var levels = {}
var ratings = {}
var problems = {}
var totalSub = 0
var heatmap = {}
var heatmapData = {}
var years = 0

function get_url(p) {
  var con = p.split("-")[0]
  var index = p.split("-")[1]

  var url = ""
  if (con.length <= 4) url = "https://codeforces.com/contest/" + con + "/problem/" + index
  else url = "https://codeforces.com/problemset/gymProblem/" + con + "/" + index

  return url
}

const loader = document.getElementById("loader")
loader.style.display = "none"

var titleTextStyle = {
  fontSize: 18,
  color: "#393939",
  bold: false,
}

// Get the form element by its ID
const form = document.getElementById("form")

const container = document.querySelector(".container")

const input = document.getElementById("username-input")

// TODO: BREAK THIS FUNCTION INTO IDK.. MORE FUNCTIONS?
async function handleSubmit(e) {
  e.preventDefault()
  loader.style.display = "block"
  container.classList.remove("d-none")
  username = ""
  verdicts = {}
  langs = {}
  tags = {}
  levels = {}
  ratings = {}
  problems = {}
  totalSub = 0
  heatmap = {}
  heatmapData = {}
  years = 0

  try {
    username = input.value.trim()

    let res = await fetch(`${api_url}user.status?handle=${username}`)
    if (res.ok) {
      res = await res.json()

      // TODO: ALSO THIS LOOP IF FROM THE ACTUAL CF VIZ CODE BASE, WORKS FINE BUT LOOKS LIKE SOME OPTIMIZATIONS CAN BE DONE TO IT..
      for (var i = res.result.length - 1; i >= 0; i--) {
        var sub = res.result[i]

        // creating unique key for problem {contestID + problem name + problem rating}
        var rating
        if (sub.problem.rating === undefined) {
          rating = 0
        } else {
          rating = sub.problem.rating
        }

        var problemId = sub.problem.contestId + "-" + sub.problem.name + "-" + rating

        // previous id for removing duplicates
        var problemIdprev = sub.problem.contestId - 1 + "-" + sub.problem.name + "-" + rating

        // next id for removing duplicates
        var problemIdnext = sub.problem.contestId + 1 + "-" + sub.problem.name + "-" + rating

        // checking if problem previously visited
        if (problems[problemIdprev] !== undefined) {
          if (problems[problemIdprev].solved === 0) {
            problems[problemIdprev].attempts++
          }
          problemId = problemIdprev
        } else if (problems[problemIdnext] !== undefined) {
          if (problems[problemIdnext].solved === 0) {
            problems[problemIdnext].attempts++
          }
          problemId = problemIdnext
        } else if (problems[problemId] !== undefined) {
          if (problems[problemId].solved === 0) {
            problems[problemId].attempts++
          }
        } else {
          problems[problemId] = {
            problemlink: sub.contestId + "-" + sub.problem.index, // link of problem
            attempts: 1,
            solved: 0, // We also want to save how many submission got AC, a better name would have been number_of_ac
          }
        }

        if (sub.verdict == "OK") {
          problems[problemId].solved++
        }

        // modifying level, rating, and tag counter on first AC.
        if (problems[problemId].solved === 1 && sub.verdict == "OK") {
          sub.problem.tags.forEach(function (t) {
            if (tags[t] === undefined) tags[t] = 1
            else tags[t]++
          })

          if (levels[sub.problem.index[0]] === undefined) levels[sub.problem.index[0]] = 1
          else levels[sub.problem.index[0]]++

          if (sub.problem.rating) {
            if (ratings[sub.problem.rating] === undefined) {
              ratings[sub.problem.rating] = 1
            } else {
              ratings[sub.problem.rating]++
            }
          }
        }

        // changing counter of verdict submission
        if (verdicts[sub.verdict] === undefined) verdicts[sub.verdict] = 1
        else verdicts[sub.verdict]++

        // changing counter of launguage submission
        if (langs[sub.programmingLanguage] === undefined) langs[sub.programmingLanguage] = 1
        else langs[sub.programmingLanguage]++

        //updating the heatmap
        var date = new Date(sub.creationTimeSeconds * 1000) // submission date
        date.setHours(0, 0, 0, 0)
        if (heatmap[date.valueOf()] === undefined) heatmap[date.valueOf()] = 1
        else heatmap[date.valueOf()]++
        totalSub = res.result.length

        // how many years are there between first and last submission
        years =
          new Date(res.result[0].creationTimeSeconds * 1000).getYear() -
          new Date(res.result[res.result.length - 1].creationTimeSeconds * 1000).getYear()
        years = Math.abs(years) + 1
      }

      drawVerdictChart()
      drawLangChart()
      drawTagChart()
      drawLevelChart()
      drawProblemRatingsChart()
      drawHeatmap()

      // Parse all the solved problems and extract some numbers about the solved problems
      var tried = 0
      var solved = 0
      var maxAttempt = 0
      var maxAttemptProblem = ""
      var maxAc = ""
      var maxAcProblem = ""
      var unsolved = []
      var solvedWithOneSub = 0

      for (var p in problems) {
        tried++
        if (problems[p].solved > 0) solved++
        if (problems[p].solved === 0) unsolved.push(problems[p].problemlink)

        if (problems[p].attempts > maxAttempt) {
          maxAttempt = problems[p].attempts
          maxAttemptProblem = problems[p].problemlink
        }
        if (problems[p].solved > maxAc) {
          maxAc = problems[p].solved
          maxAcProblem = problems[p].problemlink
        }

        if (problems[p].solved > 0 && problems[p].attempts == 1) solvedWithOneSub++
      }

      // Remove 'hidden' class from elements
      var numbersElement = document.getElementById("numbers")
      var unsolvedConElement = document.getElementById("unsolvedCon")
      numbersElement.classList.remove("d-none")
      unsolvedConElement.classList.remove("d-none")

      // Update content using vanilla JavaScript
      var handleTextElement = document.querySelectorAll(".handle-text")
      handleTextElement.forEach((el) => {
        el.textContent = username
      })

      document.getElementById("tried").textContent = tried
      document.getElementById("solved").textContent = solved

      var maxAttemptElement = document.getElementById("maxAttempt")
      maxAttemptElement.innerHTML =
        maxAttempt + '<a href="' + get_url(maxAttemptProblem) + '" target="_blank"> (' + maxAttemptProblem + ") </a>"

      var maxAcElement = document.getElementById("maxAc")
      if (maxAc > 1) {
        maxAcElement.innerHTML =
          maxAc + '<a href="' + get_url(maxAcProblem) + '" target="_blank"> (' + maxAcProblem + ") </a>"
      } else {
        maxAcElement.textContent = solved ? 1 : 0
      }

      document.getElementById("averageAttempt").textContent = (totalSub / solved).toFixed(2)

      var solvedWithOneSubElement = document.getElementById("solvedWithOneSub")
      solvedWithOneSubElement.textContent =
        solvedWithOneSub + " (" + (solved ? ((solvedWithOneSub / solved) * 100).toFixed(2) : 0) + "%)"

      var unsolvedListElement = document.getElementById("unsolvedList")
      unsolved.forEach(function (p, index) {
        var url = get_url(p)
        var span = document.createElement("span")
        span.classList.add("m-1", "badge", "rounded-pill", "text-bg-light", "fs-6")

        var link = document.createElement("a")
        link.href = url
        link.target = "_blank"

        link.classList.add("lnk")
        link.textContent = p

        span.appendChild(link)
        unsolvedListElement.appendChild(span)
      })

      const response1 = await fetch(api_url + "user.rating?handle=" + username)

      if (!response1.ok) {
        throw new Error("Failed to fetch user info")
      }

      const data1 = await response1.json()

      if (data1.result.length < 1) {
        err_message("handleDiv", "No contests")
        return
      }

      let best = 1e10
      let worst = -1e10
      let maxUp = 0
      let maxDown = 0
      let bestCon = ""
      let worstCon = ""
      let maxUpCon = ""
      let maxDownCon = ""
      let tot = data1.result.length

      data1.result.forEach(function (con) {
        // con is a contest
        if (con.rank < best) {
          best = con.rank
          bestCon = con.contestId
        }
        if (con.rank > worst) {
          worst = con.rank
          worstCon = con.contestId
        }
        const ch = con.newRating - con.oldRating
        if (ch > maxUp) {
          maxUp = ch
          maxUpCon = con.contestId
        }
        if (ch < maxDown) {
          maxDown = ch
          maxDownCon = con.contestId
        }
      })

      // Showing the rating change data in proper places
      const con_url = "https://codeforces.com/contest/"
      document.getElementById("contests").classList.remove("d-none")
      document.querySelector(".handle-text").textContent = username
      document.getElementById("contestCount").textContent = tot
      document.getElementById("best").innerHTML =
        best + '<a href="' + con_url + bestCon + '" target="_blank"> (' + bestCon + ") </a>"
      document.getElementById("worst").innerHTML =
        worst + '<a href="' + con_url + worstCon + '" target="_blank"> (' + worstCon + ") </a>"
      document.getElementById("maxUp").innerHTML =
        maxUp + '<a href="' + con_url + maxUpCon + '" target="_blank"> (' + maxUpCon + ") </a>"
      document.getElementById("maxDown").innerHTML = maxDown
        ? maxDown + '<a href="' + con_url + maxDownCon + '" target="_blank"> (' + maxDownCon + ") </a>"
        : "---"

    } else {
      throw Error("User not found!")
    }
  } catch (err) {
    console.error(err)
  } finally {
    // resetForm();
    loader.style.display = "none"
  }
  console.log("RUNNING")
}

// Add a submit event listener to the form
form.addEventListener("submit", handleSubmit)

function resetForm() {
  input.value = ""
}

function drawCharts() {
  drawVerdictChart()
  drawLangChart()
  drawTagChart()
  drawLevelChart()
  drawProblemRatingsChart()
  drawHeatmap()
}

function drawVerdictChart() {
  const verdictDiv = document.getElementById("verdicts")
  verdictDiv.classList.remove("d-none")
  verdictDiv.classList.add("card")
  var verTable = [["Verdict", "Count"]]
  var verSliceColors = []
  // beautiful names for the verdicts + colors
  for (var ver in verdicts) {
    if (ver == "OK") {
      verTable.push(["AC", verdicts[ver]])
      verSliceColors.push({ color: "#FFC3A0" })
    } else if (ver == "WRONG_ANSWER") {
      verTable.push(["WA", verdicts[ver]])
      verSliceColors.push({ color: "#FF677D" })
    } else if (ver == "TIME_LIMIT_EXCEEDED") {
      verTable.push(["TLE", verdicts[ver]])
      verSliceColors.push({ color: "#D4A5A5" })
    } else if (ver == "MEMORY_LIMIT_EXCEEDED") {
      verTable.push(["MLE", verdicts[ver]])
      verSliceColors.push({ color: "#392F5A" })
    } else if (ver == "RUNTIME_ERROR") {
      verTable.push(["RTE", verdicts[ver]])
      verSliceColors.push({ color: "#31A2AC" })
    } else if (ver == "COMPILATION_ERROR") {
      verTable.push(["CPE", verdicts[ver]])
      verSliceColors.push({ color: "#61C0BF" })
    } else if (ver == "SKIPPED") {
      verTable.push(["SKIPPED", verdicts[ver]])
      verSliceColors.push({ color: "#6B4226" })
    } else if (ver == "CLALLENGED") {
      verTable.push(["CLALLENGED", verdicts[ver]])
      verSliceColors.push({ color: "#D9BF77" })
    } else {
      verTable.push([ver, verdicts[ver]])
      verSliceColors.push({})
    }
  }
  verdicts = new google.visualization.arrayToDataTable(verTable)
  var verOptions = {
    height: verdictDiv.getBoundingClientRect().width,
    title: "Verdicts of " + username,
    legend: "none",
    pieSliceText: "label",
    slices: verSliceColors,
    fontName: "Menlo",
    backgroundColor: "white",
    titleTextStyle: { color: "#212529", fontSize: "16" },
    legend: {
      textStyle: {
        color: "#212529",
      },
    },
    is3D: true,
  }

  var verChart = new google.visualization.PieChart(verdictDiv)
  verChart.draw(verdicts, verOptions)
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
]

function drawLangChart() {
  const langDiv = document.getElementById("langs")
  langDiv.classList.remove("d-none")
  langDiv.classList.add("card")
  var langTable = [["Language", "Count"]]
  for (var lang in langs) {
    langTable.push([lang, langs[lang]])
  }
  langs = new google.visualization.arrayToDataTable(langTable)

  var langOptions = {
    height: langDiv.getBoundingClientRect().width,
    title: "Languages of " + username,
    legend: "none",
    pieSliceText: "label",
    fontName: "Menlo",
    backgroundColor: "white",
    titleTextStyle: { color: "#212529", fontSize: "16" },
    legend: {
      textStyle: {
        color: "#212529",
      },
    },
    is3D: true,
    colors: colors.slice(0, Math.min(colors.length, langs.getNumberOfRows())),
  }

  var langChart = new google.visualization.PieChart(langDiv)
  langChart.draw(langs, langOptions)
}

function drawTagChart() {
  const tagsDiv = document.getElementById("tags")
  tagsDiv.classList.remove("d-none")
  var tagTable = []
  for (var tag in tags) {
    tagTable.push([tag + ": " + tags[tag], tags[tag]])
  }
  tagTable.sort(function (a, b) {
    return b[1] - a[1]
  })
  tags = new google.visualization.DataTable()
  tags.addColumn("string", "Tag")
  tags.addColumn("number", "solved")
  tags.addRows(tagTable)
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
    backgroundColor: "white",
    titleTextStyle: { color: "#212529", fontSize: "16" },
    legend: {
      textStyle: {
        color: "#212529",
      },
    },
    colors: colors.slice(0, Math.min(colors.length, tags.getNumberOfRows())),
  }

  var tagChart = new google.visualization.PieChart(document.getElementById("tags"))
  tagChart.draw(tags, tagOptions)
}

function drawLevelChart() {
  const levelsDiv = document.getElementById("levels")
  levelsDiv.classList.remove("d-none")
  var levelTable = []
  for (var level in levels) {
    levelTable.push([level, levels[level]])
  }
  levelTable.sort(function (a, b) {
    if (a[0] > b[0]) return -1
    else return 1
  })
  levels = new google.visualization.DataTable()
  levels.addColumn("string", "Level")
  levels.addColumn("number", "solved")
  levels.addRows(levelTable)
  var levelOptions = {
    width: Math.max(levelsDiv.getBoundingClientRect().width, levels.getNumberOfRows() * 50),
    height: 300,
    title: "Levels of " + username,
    legend: "none",
    fontName: "Menlo",
    backgroundColor: "white",
    titleTextStyle: { color: "#212529", fontSize: "16" },
    legend: {
      textStyle: {
        color: "#212529",
      },
    },
    vAxis: { format: "0" },
    colors: ["#AA4B6B"],
    is3D: true,
  }

  var levelChart = new google.visualization.ColumnChart(levelsDiv)
  if (levelTable.length > 1) levelChart.draw(levels, levelOptions)
}

function drawProblemRatingsChart() {
  //Plotting ratings
  const ratingsDiv = document.getElementById("ratings")
  ratingsDiv.classList.remove("d-none")
  var ratingTable = []
  for (var rating in ratings) {
    ratingTable.push([rating, ratings[rating]])
  }
  ratingTable.sort(function (a, b) {
    if (parseInt(a[0]) > parseInt(b[0])) return -1
    else return 1
  })
  ratings = new google.visualization.DataTable()
  ratings.addColumn("string", "Rating")
  ratings.addColumn("number", "solved")
  ratings.addRows(ratingTable)
  var ratingOptions = {
    width: Math.max(ratingsDiv.getBoundingClientRect().width, ratings.getNumberOfRows() * 50),
    height: 300,
    title: "Problem ratings of " + username,
    legend: "none",
    fontName: "Menlo",
    backgroundColor: "white",
    titleTextStyle: { color: "#212529", fontSize: "16" },
    legend: {
      textStyle: {
        color: "#212529",
      },
    },
    vAxis: { format: "0" },
    colors: ["#663F46"],
  }

  var ratingChart = new google.visualization.ColumnChart(ratingsDiv)
  if (ratingTable.length > 1) ratingChart.draw(ratings, ratingOptions)
}

function drawHeatmap() {
  const heatMapDiv = document.getElementById("heatmap")
  const heatMapContainerDiv = document.getElementById("heatMapContainer")
  const heatMapHandleSpan = document.getElementById("heatMapHandle")
  heatMapContainerDiv.classList.remove("d-none")
  heatMapHandleSpan.innerHTML = username
  var heatmapTable = []
  for (var d in heatmap) {
    heatmapTable.push([new Date(parseInt(d)), heatmap[d]])
  }
  heatmapData = new google.visualization.DataTable()
  heatmapData.addColumn({ type: "date", id: "Date" })
  heatmapData.addColumn({ type: "number", id: "Submissions" })
  heatmapData.addRows(heatmapTable)

  heatmap = new google.visualization.Calendar(heatMapDiv)
  var heatmapOptions = {
    height: years * 140 + 30,
    width: Math.max(heatMapContainerDiv.getBoundingClientRect().width, 900),
    fontName: "Menlo",
    backgroundColor: "white",
    titleTextStyle: { color: "#212529", fontSize: "16" },
    legend: {
      textStyle: {
        color: "#212529",
      },
    },
    colorAxis: {
      minValue: 0,
      colors: ["#9be9a8", "#30a14e", "#216e39"],
    },
    calendar: {
      cellSize: 15,
    },
  }

  heatmap.draw(heatmapData, heatmapOptions)
}
