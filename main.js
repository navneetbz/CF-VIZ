var dark = false;
var api_url = "https://codeforces.com/api/";

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

// TODO: BREAK THIS FUNCTION INTO IDK.. MORE FUNCTIONS?
async function handleSubmit(e) {
  e.preventDefault();
  try {
    const username = input.value.trim();
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
    resetForm();
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
