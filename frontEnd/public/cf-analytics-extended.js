// ==UserScript==
// @name         CF Analytics Extended
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Adds charts, heatmap, and unsolved problem list on Codeforces profile page with dark mode support
// @author       darelife
// @match        https://codeforces.com/profile/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/chart.js
// ==/UserScript==

(function () {
  "use strict";

  var problems = new Map();
  var ratings = new Map();
  var tags = new Map();
  var ratingChartLabel = [];
  var ratingChartData = [];
  var ratingChartBackgroundColor = [];
  var tagChartLabel = [];
  var tagChartData = [];

  ratings[Symbol.iterator] = function* () {
    yield* [...ratings.entries()].sort((a, b) => a[0] - b[0]);
  };

  tags[Symbol.iterator] = function* () {
    yield* [...tags.entries()].sort((a, b) => b[1] - a[1]);
  };

  const tagColorArray = [
    "#8e99f3",
    "#80d6ff",
    "#64d8cb",
    "#98ee99",
    "#cfff95",
    "#ffff8b",
    "#fffd61",
    "#ffd95b",
    "#ffa270",
    "#ff867c",
    "#ff77a9",
    "#df78ef",
    "#b085f5",
    "#6ff9ff",
  ];

  // === Inject HTML and CSS ===
  const customStyles = `
    .cf-analytics-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 20px;
    }
    .analytics-card {
        background-color: #2c2c2c;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }
    .analytics-card h3 {
        color: #e0e0e0;
        border-bottom: 1px solid #444;
        padding-bottom: 10px;
        margin-top: 0;
    }
    .analytics-card a {
        color: #58a6ff;
    }
    .analytics-card a:hover {
        text-decoration: underline;
    }

    /* Filters */
    .filter-group {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }
    .filter-group label {
      color: #e0e0e0;
      font-size: 14px;
    }
    .filter-group input[type="number"] {
        background-color: #383838;
        border: 1px solid #555;
        color: #e0e0e0;
        border-radius: 4px;
        padding: 5px 8px;
        width: 70px;
        font-family: inherit;
    }
    .filter-group button {
        background-color: #216e39;
        color: #e0e0e0;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-weight: bold;
    }
    .filter-group button:hover {
        background-color: #2ea043;
    }

    /* Charts */
    .chart-container {
      width: 100%;
      height: 300px;
    }

    /* Heatmap */
    .heatmap-container {
      overflow-x: auto;
    }
    #ratingHeatmapCanvas {
        border: 1px solid #444 !important;
        background-color: #2c2c2c;
        border-radius: 4px;
        display: block;
    }
#heatmapTooltip {
    background: #444 !important;
    color: #fff !important;
    padding: 5px 8px;
    font-size: 12px;
    border-radius: 4px;
    pointer-events: none; /* IMPORTANT */
    display: none;
    z-index: 1000;
    position: fixed; /* stick to viewport */
    white-space: nowrap;
    box-shadow: 0 0 6px rgba(0,0,0,0.5);
}

    /* Unsolved problems */
    .unsolved-problem-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    .unsolved-problem-list .unsolved_problem {
        color: #58a6ff;
        font-size: 14px;
        text-decoration: none;
    }
    .unsolved-problem-list .unsolved_problem:hover {
        text-decoration: underline;
    }

    /* Tags list */
    .tag-list-container {
        margin-top: 20px;
    }
    .tag-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
        list-style: none;
        padding: 0;
        color: #e0e0e0;
    }
    .tag-list li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;

  document.head.insertAdjacentHTML(
    "beforeend",
    `<style>${customStyles}</style>`
  );
  document.querySelector("#pageContent").insertAdjacentHTML(
    "beforeend",
    `
    <div class="cf-analytics-container">
        <div class="analytics-card">
            <h3>Problems Solved by Rating</h3>
            <div class="filter-group">
                <label>Min Rating: <input id="minRating" type="number" value="800"></label>
                <label>Max Rating: <input id="maxRating" type="number" value="3500"></label>
                <button id="applyFilter">Apply</button>
            </div>
            <div class="chart-container">
              <canvas id="problemRatingChart"></canvas>
            </div>
        </div>

        <div class="analytics-card">
            <h3>Tags Solved</h3>
            <div class="chart-container">
              <canvas id="tagChart"></canvas>
            </div>
            <div class="tag-list-container">
              <ul id="tag_list" class="tag-list"></ul>
            </div>
        </div>

        <div class="analytics-card heatmap-container">
            <h3>Rating Heatmap (Last 12 months)</h3>
            <canvas id="ratingHeatmapCanvas"></canvas>
            <div id="heatmapTooltip"></div>
        </div>

        <div class="analytics-card">
            <h3>Unsolved Problems</h3>
            <p id="unsolved_count"></p>
            <div id="unsolved_list" class="unsolved-problem-list"></div>
        </div>
    </div>
  `
  );

  const profileId = getProfileIdFromUrl(window.location.href);

  fetch(`https://codeforces.com/api/user.status?handle=${profileId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "OK") {
        processData(data.result);
        createProblemRatingChart();
        createTagChart();
      } else {
        console.error(`${data.status} : ${data.comment}`);
      }
    });

  function getProfileIdFromUrl(url) {
    return url.split("/").pop().split("?")[0];
  }

  function processData(resultArr) {
    let unsolvedCount = 0;
    let dailySolved = new Map();

    resultArr.forEach((sub) => {
      const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
      if (!problems.has(problemId)) {
        problems.set(problemId, {
          solved: false,
          rating: sub.problem.rating,
          contestId: sub.problem.contestId,
          index: sub.problem.index,
          tags: sub.problem.tags,
          creationTimeSeconds: sub.creationTimeSeconds,
        });
      }

      if (sub.verdict === "OK") {
        const obj = problems.get(problemId);
        if (obj) {
          obj.solved = true;
          problems.set(problemId, obj);
        }
      }
    });

    problems.forEach((prob) => {
      if (prob.rating && prob.solved === true) {
        if (!ratings.has(prob.rating)) ratings.set(prob.rating, 0);
        ratings.set(prob.rating, ratings.get(prob.rating) + 1);
      }

      if (prob.solved === false) {
        unsolvedCount++;
        const problemURL = findProblemURL(prob.contestId, prob.index);
        document
          .querySelector("#unsolved_list")
          .insertAdjacentHTML(
            "beforeend",
            `<a class="unsolved_problem" href="${problemURL}">${prob.contestId}-${prob.index}</a>`
          );
      }

      if (prob.solved === true && prob.rating) {
        const day = new Date(prob.creationTimeSeconds * 1000);
        const key = day.toISOString().slice(0, 10);
        if (!dailySolved.has(key)) dailySolved.set(key, []);
        dailySolved.get(key).push(prob.rating);

        prob.tags.forEach((tag) => {
          if (!tags.has(tag)) tags.set(tag, 0);
          tags.set(tag, tags.get(tag) + 1);
        });
      }
    });

    document.querySelector(
      "#unsolved_count"
    ).textContent = `Count: ${unsolvedCount}`;

    for (const [key, val] of ratings) {
      ratingChartLabel.push(key);
      ratingChartData.push(val);
      ratingChartBackgroundColor.push(ratingBackgroundColor(key));
    }

    let tagListHtml = "";
    let i = 0;
    for (const [key, val] of tags) {
      tagChartLabel.push(key);
      tagChartData.push(val);
      tagListHtml += `
        <li>
            <svg width="12" height="12">
                <rect width="12" height="12" style="fill:${
                  tagColorArray[i % tagColorArray.length]
                };stroke-width:1;stroke:rgb(0,0,0)" />
            </svg>
            ${key}: ${val}
        </li>`;
      i++;
    }
    document.querySelector("#tag_list").innerHTML = tagListHtml;

    drawHeatmap(dailySolved);
  }

  function findProblemURL(contestId, index) {
    return contestId.toString().length <= 4
      ? `https://codeforces.com/problemset/problem/${contestId}/${index}`
      : `https://codeforces.com/problemset/gymProblem/${contestId}/${index}`;
  }

  function createProblemRatingChart() {
    const chartExist = Chart.getChart("problemRatingChart");
    if (chartExist) {
      chartExist.data.labels = ratingChartLabel;
      chartExist.data.datasets[0].data = ratingChartData;
      chartExist.data.datasets[0].backgroundColor = ratingChartBackgroundColor;
      chartExist.update();
      return;
    }

    const ctx = document.getElementById("problemRatingChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ratingChartLabel,
        datasets: [
          {
            label: "Problems Solved",
            data: ratingChartData,
            backgroundColor: ratingChartBackgroundColor,
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 0.75,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { text: "Problem Rating", display: false },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#e0e0e0" },
          },
          y: {
            title: { text: "Problems Solved", display: false },
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#e0e0e0" },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#e0e0e0",
            },
          },
        },
      },
    });
  }

  function createTagChart() {
    const chartExist = Chart.getChart("tagChart");
    if (chartExist) {
      chartExist.data.labels = tagChartLabel;
      chartExist.data.datasets[0].data = tagChartData;
      chartExist.update();
      return;
    }

    const ctx = document.getElementById("tagChart").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: tagChartLabel,
        datasets: [
          {
            label: "Tags Solved",
            data: tagChartData,
            backgroundColor: tagColorArray,
            borderWidth: 0.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#444",
            titleColor: "#e0e0e0",
            bodyColor: "#e0e0e0",
          },
        },
      },
    });
  }

  function ratingBackgroundColor(rating) {
    if (rating >= 3000) return "rgba(170, 0, 0, 0.9)";
    if (rating >= 2600) return "rgba(255, 51, 51, 0.9)";
    if (rating >= 2400) return "rgba(255, 119, 119, 0.9)";
    if (rating >= 2300) return "rgba(255, 187, 85, 0.9)";
    if (rating >= 2100) return "rgba(255, 204, 136, 0.9)";
    if (rating >= 1900) return "rgba(255, 136, 255, 0.9)";
    if (rating >= 1600) return "rgba(170, 170, 255, 0.9)";
    if (rating >= 1400) return "rgba(119, 221, 187, 0.9)";
    if (rating >= 1200) return "rgba(119, 255, 119, 0.9)";
    return "rgba(204, 204, 204, 0.9)";
  }

  // === Heatmap ===
  function drawHeatmap(dailySolved) {
    const container = document.querySelector(".heatmap-container");
    const canvas = document.getElementById("ratingHeatmapCanvas");
    const ctx = canvas.getContext("2d");
    const tooltip = document.getElementById("heatmapTooltip");

    const today = new Date();
    let start = new Date(today);
    start.setMonth(start.getMonth() - 12);
    start.setHours(0, 0, 0, 0);

    const cellSize = 12,
      padding = 3;
    const containerWidth = container.clientWidth - 2 * 20;
    const columns = Math.floor(containerWidth / (cellSize + padding));

    canvas.width = columns * (cellSize + padding) + padding;
    canvas.height = 7 * (cellSize + padding) + padding;

    let x = 0,
      y = 0;
    const positions = [];

    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      let color = "#1e1e1e";
      let avg = null,
        count = 0;
      if (dailySolved.has(key)) {
        const ratings = dailySolved.get(key);
        avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        color = cfRankColor(avg);
        count = ratings.length;
      }
      ctx.fillStyle = color;
      const px = x * (cellSize + padding) + padding,
        py = y * (cellSize + padding) + padding;
      ctx.fillRect(px, py, cellSize, cellSize);

      positions.push({
        x: px,
        y: py,
        w: cellSize,
        h: cellSize,
        date: key,
        avg: avg,
        count: count,
      });

      y++;
      if (y >= 7) {
        y = 0;
        x++;
      }
    }

    // === Tooltip interactivity ===
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      let found = null;
      for (let p of positions) {
        if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h) {
          found = p;
          break;
        }
      }
      if (found) {
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX + 15 + "px"; // slightly to right
        tooltip.style.top = e.clientY + 15 + "px"; // slightly below cursor
        tooltip.innerHTML = `
  <strong>${found.date}</strong><br/>
  Solved: ${found.count}<br/>
  Avg Rating: ${found.avg ? found.avg.toFixed(0) : "–"}
`;
      } else {
        tooltip.style.display = "none";
      }
    });

    canvas.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });

    // Handle window resize to redraw heatmap
    window.addEventListener("resize", () => {
      drawHeatmap(dailySolved);
    });
  }

  function cfRankColor(r) {
    if (r >= 3000) return "rgba(170, 0, 0, 0.9)";
    if (r >= 2600) return "rgba(255, 51, 51, 0.9)";
    if (r >= 2400) return "rgba(255, 119, 119, 0.9)";
    if (r >= 2300) return "rgba(255, 187, 85, 0.9)";
    if (r >= 2100) return "rgba(255, 204, 136, 0.9)";
    if (r >= 1900) return "rgba(255, 136, 255, 0.9)";
    if (r >= 1600) return "rgba(170, 170, 255, 0.9)";
    if (r >= 1400) return "rgba(119, 221, 187, 0.9)";
    if (r >= 1200) return "rgba(119, 255, 119, 0.9)";
    return "rgba(204, 204, 204, 0.9)";
  }

  // === Histogram filter button ===
  document.getElementById("applyFilter").addEventListener("click", () => {
    const minR = parseInt(document.getElementById("minRating").value) || 0;
    const maxR = parseInt(document.getElementById("maxRating").value) || 9999;
    ratingChartLabel.length = 0;
    ratingChartData.length = 0;
    ratingChartBackgroundColor.length = 0;
    for (const [key, val] of ratings) {
      if (key >= minR && key <= maxR) {
        ratingChartLabel.push(key);
        ratingChartData.push(val);
        ratingChartBackgroundColor.push(ratingBackgroundColor(key));
      }
    }
    createProblemRatingChart();
  });
})();
