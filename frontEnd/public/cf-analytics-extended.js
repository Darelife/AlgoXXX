// ==UserScript==
// @name         CF Analytics Extended
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Tabbed analytics dashboard for Codeforces profiles: rating & tag breakdowns, verdict/language stats, a submission heatmap, contest rating history, a filterable unsolved-problems explorer, a Problem-of-the-Day / mashup generator, and a curated CP resources page.
// @author       CF Analytics, Darelife
// @match        https://codeforces.com/profile/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/chart.js
// ==/UserScript==

// Originally adapted from the CF Analytics browser extension so it could run
// as a single Tampermonkey script on Firefox for Android (no extension store
// there). Rewritten into a tabbed dashboard with caching, contests, verdict
// and language breakdowns, and a filterable unsolved-problem explorer.
(function () {
  "use strict";

  // ================= CONFIG =================
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
  const TAG_COLORS = [
    "#8e99f3", "#80d6ff", "#64d8cb", "#98ee99", "#cfff95", "#ffff8b",
    "#fffd61", "#ffd95b", "#ffa270", "#ff867c", "#ff77a9", "#df78ef",
    "#b085f5", "#6ff9ff", "#4dd0e1", "#aed581", "#f06292", "#7986cb",
    "#a1887f", "#90a4ae",
  ];
  const VERDICT_LABELS = {
    OK: "Accepted",
    WRONG_ANSWER: "Wrong Answer",
    TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
    MEMORY_LIMIT_EXCEEDED: "Memory Limit Exceeded",
    RUNTIME_ERROR: "Runtime Error",
    COMPILATION_ERROR: "Compilation Error",
    CHALLENGED: "Hacked",
    PARTIAL: "Partial",
    PRESENTATION_ERROR: "Presentation Error",
    IDLENESS_LIMIT_EXCEEDED: "Idleness Limit Exceeded",
    SECURITY_VIOLATED: "Security Violated",
    CRASHED: "Crashed",
    INPUT_PREPARATION_CRASHED: "Input Preparation Crashed",
    FAILED: "Failed",
    REJECTED: "Rejected",
    SKIPPED: "Skipped",
    TESTING: "In Queue",
  };
  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "rating", label: "Rating" },
    { id: "tags", label: "Tags" },
    { id: "activity", label: "Activity" },
    { id: "contests", label: "Contests" },
    { id: "unsolved", label: "Unsolved" },
    { id: "practice", label: "Practice" },
    { id: "resources", label: "Guides" },
  ];

  const RESOURCE_GROUPS = [
    {
      title: "Learning & Theory",
      links: [
        { name: "cp-algorithms.com", url: "https://cp-algorithms.com/", note: "Reference for algorithms & data structures used in CP" },
        { name: "USACO Guide", url: "https://usaco.guide/", note: "Structured curriculum from bronze to platinum" },
        { name: "Competitive Programmer's Handbook", url: "https://cses.fi/book/book.pdf", note: "Free book by Antti Laaksonen (CSES)" },
        { name: "KACTL", url: "https://github.com/kth-competitive-programming/kactl", note: "KTH's ICPC team reference notebook" },
        { name: "Codeforces EDU", url: "https://codeforces.com/edu/courses", note: "Official CF courses with lessons + practice sets" },
      ],
    },
    {
      title: "Practice Judges & Problem Sets",
      links: [
        { name: "CSES Problem Set", url: "https://cses.fi/problemset/", note: "Curated core problems, great for fundamentals" },
        { name: "AtCoder", url: "https://atcoder.jp/", note: "Clean problems, strong editorials" },
        { name: "CodeChef", url: "https://www.codechef.com/", note: "Long/short contests, wide difficulty range" },
        { name: "Library Checker", url: "https://judge.yosupo.jp/", note: "Verification judge for data structures/algorithms" },
        { name: "Kattis", url: "https://open.kattis.com/", note: "Large, well-tested international problem archive" },
        { name: "LeetCode", url: "https://leetcode.com/", note: "Interview-style practice" },
      ],
    },
    {
      title: "Contest Tools & Trackers",
      links: [
        { name: "CLIST", url: "https://clist.by/", note: "Aggregated contest schedule across judges" },
        { name: "vjudge", url: "https://vjudge.net/", note: "Virtual judge for mashups across multiple OJs" },
        { name: "Codeforces API Docs", url: "https://codeforces.com/apiHelp", note: "For building your own tools like this one" },
      ],
    },
    {
      title: "Blogs & Channels",
      links: [
        { name: "Errichto", url: "https://www.youtube.com/@Errichto", note: "Editorials, tutorials, live problem solving" },
        { name: "SecondThread", url: "https://www.youtube.com/@SecondThread", note: "Deep dives on rating up & specific topics" },
        { name: "Codeforces Blogs", url: "https://codeforces.com/blog", note: "Community write-ups, editorials, announcements" },
      ],
    },
  ];

  const CSS = `
    :root {
      --cfa-bg: #1c1c1c;
      --cfa-card: #2c2c2c;
      --cfa-card-alt: #242424;
      --cfa-border: #3a3a3a;
      --cfa-text: #e0e0e0;
      --cfa-text-dim: #9a9a9a;
      --cfa-accent: #58a6ff;
      --cfa-green: #2ea043;
    }
    .cfa-root {
      margin-top: 20px;
      background: var(--cfa-bg);
      border: 1px solid var(--cfa-border);
      border-radius: 10px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .cfa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--cfa-border);
      flex-wrap: wrap;
      gap: 10px;
    }
    .cfa-title { margin: 0; color: var(--cfa-text); font-size: 18px; }
    .cfa-header-actions { display: flex; align-items: center; gap: 10px; }
    .cfa-last-updated { color: var(--cfa-text-dim); font-size: 12px; }
    .cfa-btn {
      background: var(--cfa-card-alt);
      color: var(--cfa-text);
      border: 1px solid var(--cfa-border);
      border-radius: 6px;
      padding: 5px 10px;
      cursor: pointer;
      font-size: 13px;
    }
    .cfa-btn:hover { border-color: var(--cfa-accent); color: var(--cfa-accent); }

    .cfa-body { padding: 16px; }
    .cfa-status { display: flex; align-items: center; gap: 10px; color: var(--cfa-text-dim); padding: 6px 2px 14px; font-size: 14px; }
    .cfa-status:empty { display: none; padding: 0; }
    .cfa-status-error { color: #ff8080; }
    .cfa-spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid var(--cfa-border); border-top-color: var(--cfa-accent);
      animation: cfa-spin 0.7s linear infinite;
    }
    @keyframes cfa-spin { to { transform: rotate(360deg); } }

    .cfa-tabbar {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin-bottom: 14px;
      border-bottom: 1px solid var(--cfa-border);
      -webkit-overflow-scrolling: touch;
    }
    .cfa-tab-btn {
      background: transparent;
      border: none;
      color: var(--cfa-text-dim);
      padding: 8px 14px;
      border-radius: 6px 6px 0 0;
      cursor: pointer;
      font-size: 14px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .cfa-tab-btn:hover { color: var(--cfa-text); background: var(--cfa-card-alt); }
    .cfa-tab-btn.active { color: var(--cfa-accent); background: var(--cfa-card-alt); font-weight: 600; }
    .cfa-tab-btn:disabled { opacity: 0.4; cursor: default; }

    .cfa-panel { display: none; flex-direction: column; gap: 16px; }
    .cfa-panel.active { display: flex; }

    .analytics-card {
      background: var(--cfa-card);
      border: 1px solid var(--cfa-border);
      border-radius: 8px;
      padding: 18px;
    }
    .analytics-card h3 { color: var(--cfa-text); border-bottom: 1px solid var(--cfa-border); padding-bottom: 10px; margin: 0 0 14px; font-size: 15px; }
    .analytics-card a { color: var(--cfa-accent); }
    .analytics-card a:hover { text-decoration: underline; }

    .cfa-chart-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .cfa-half { flex: 1 1 320px; }

    .chart-container { width: 100%; height: 280px; }

    .cfa-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
    .cfa-stat-grid-compact { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); margin-top: 16px; }
    .cfa-stat-card {
      background: var(--cfa-card-alt);
      border: 1px solid var(--cfa-border);
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .cfa-stat-value { color: var(--cfa-text); font-size: 20px; font-weight: 700; }
    .cfa-stat-label { color: var(--cfa-text-dim); font-size: 12px; margin-top: 4px; }

    .filter-group { display: flex; align-items: center; gap: 14px; margin-bottom: 15px; flex-wrap: wrap; }
    .filter-group label { color: var(--cfa-text); font-size: 13px; display: flex; align-items: center; gap: 6px; }
    .filter-group input, .filter-group select {
      background: var(--cfa-card-alt); border: 1px solid var(--cfa-border); color: var(--cfa-text);
      border-radius: 4px; padding: 5px 8px; font-family: inherit; font-size: 13px;
    }
    .filter-group input[type="number"] { width: 75px; }
    .filter-group button {
      background: var(--cfa-green); color: #fff; border: none; border-radius: 4px;
      padding: 6px 14px; cursor: pointer; font-weight: 600; font-size: 13px;
    }
    .filter-group button:hover { background: #2fbf4f; }

    .heatmap-container .cfa-heatmap-scroll { overflow-x: auto; }
    #ratingHeatmapCanvas { background: var(--cfa-card-alt); border-radius: 4px; display: block; }
    #heatmapTooltip {
      background: #444; color: #fff; padding: 5px 8px; font-size: 12px; border-radius: 4px;
      pointer-events: none; display: none; z-index: 1000; position: fixed; white-space: nowrap;
      box-shadow: 0 0 6px rgba(0,0,0,0.5);
    }

    .unsolved-problem-list { display: flex; flex-wrap: wrap; gap: 8px 14px; }
    .unsolved-problem-list .unsolved_problem { color: var(--cfa-accent); font-size: 13px; text-decoration: none; }
    .unsolved-problem-list .unsolved_problem:hover { text-decoration: underline; }
    .cfa-rating-badge { font-weight: 700; font-size: 12px; }

    .tag-list-container { margin-top: 18px; }
    .tag-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; list-style: none; padding: 0; margin: 0; color: var(--cfa-text); font-size: 13px; }
    .tag-list li { display: flex; align-items: center; gap: 8px; }
    .cfa-text-dim { color: var(--cfa-text-dim); }
    .cfa-focus-list { margin: 0; padding-left: 18px; color: var(--cfa-text); font-size: 13px; line-height: 1.8; }
    .cfa-empty { color: var(--cfa-text-dim); font-size: 13px; }

    .cfa-problem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; margin-top: 10px; }
    .cfa-problem-card {
      background: var(--cfa-card-alt);
      border: 1px solid var(--cfa-border);
      border-radius: 6px;
      padding: 12px;
      margin-top: 10px;
    }
    .cfa-problem-card-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .cfa-problem-card-header a { font-size: 14px; font-weight: 600; }
    .cfa-problem-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .cfa-tag-chip {
      background: rgba(88, 166, 255, 0.12);
      color: var(--cfa-accent);
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 11px;
    }

    .cfa-resource-group { margin-top: 16px; }
    .cfa-resource-group:first-child { margin-top: 0; }
    .cfa-resource-group h4 { color: var(--cfa-text); font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 8px; }
    .cfa-resource-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    .cfa-resource-list li { font-size: 13px; }
    .cfa-resource-list a { font-weight: 600; }

    @media (max-width: 700px) {
      .cfa-body { padding: 12px; }
      .cfa-title { font-size: 16px; }
      .chart-container { height: 220px; }
      .analytics-card { padding: 14px; }
      .cfa-stat-value { font-size: 17px; }
    }
  `;

  // ================= STATE =================
  const state = {
    handle: "",
    loaded: false,
    activeTab: "overview",
    userInfo: null,
    problems: new Map(), // "contestId-index" -> {contestId, index, rating, tags, solved, attempts, firstSolveTime}
    ratingCounts: new Map(), // rating -> solved count
    tagSolved: new Map(), // tag -> solved problem count
    tagAttempted: new Map(), // tag -> attempted (unique) problem count
    verdictCounts: new Map(), // verdict -> submission count
    languageCounts: new Map(), // language -> submission count
    dailySolved: new Map(), // "YYYY-MM-DD" -> [ratings of problems first-solved that day]
    ratingHistory: [], // sorted contest.rating results
    totalSubmissions: 0,
    ratingFilter: null,
    unsolvedFilters: { minRating: "", maxRating: "", tag: "", sort: "rating-asc" },
    problemset: null, // lazily loaded full CF problem list, cached 24h
    problemsetLoading: false,
    problemsetError: null,
    potdFilters: { minRating: "", maxRating: "", tag: "" },
    potdShuffleSeed: 0,
    mashupFilters: { minRating: "", maxRating: "", tags: [], count: 5 },
    mashupSeed: 0,
  };

  // ================= UTILITIES =================
  function getProfileIdFromUrl(url) {
    return url.split("/").pop().split("?")[0];
  }

  function findProblemURL(contestId, index) {
    return contestId.toString().length <= 4
      ? `https://codeforces.com/problemset/problem/${contestId}/${index}`
      : `https://codeforces.com/problemset/gymProblem/${contestId}/${index}`;
  }

  function ratingColor(rating) {
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

  // Uses the browser's local calendar day (not UTC) so "today" and the
  // heatmap line up with the user's own wall clock instead of drifting a
  // day off near midnight depending on timezone.
  function dayKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function daysDiff(key1, key2) {
    const [y1, m1, d1] = key1.split("-").map(Number);
    const [y2, m2, d2] = key2.split("-").map(Number);
    const t1 = new Date(y1, m1 - 1, d1).getTime();
    const t2 = new Date(y2, m2 - 1, d2).getTime();
    return Math.round((t2 - t1) / 86400000);
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // Deterministic RNG so "today's" pick (problem of the day, etc.) stays
  // the same across reloads but changes once the seed string changes
  // (e.g. the date, or the active filters).
  function hashStringToInt(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededPick(list, seedStr) {
    if (!list.length) return null;
    const rng = mulberry32(hashStringToInt(seedStr));
    return list[Math.floor(rng() * list.length)];
  }

  function seededSample(list, count, seedStr) {
    const rng = mulberry32(hashStringToInt(seedStr));
    const pool = list.slice();
    const picked = [];
    while (pool.length && picked.length < count) {
      const idx = Math.floor(rng() * pool.length);
      picked.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return picked;
  }

  // ================= CACHE =================
  function cacheKeyFor(handle) {
    return `cfAnalyticsCache_${handle}`;
  }

  function loadCache(handle) {
    try {
      const raw = localStorage.getItem(cacheKeyFor(handle));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveCache(handle, payload) {
    try {
      localStorage.setItem(
        cacheKeyFor(handle),
        JSON.stringify({ ...payload, timestamp: Date.now() })
      );
    } catch (e) {
      // localStorage may be unavailable/full; caching is a nice-to-have.
    }
  }

  const PROBLEMSET_CACHE_KEY = "cfAnalyticsProblemsetCache";
  const PROBLEMSET_TTL_MS = 24 * 60 * 60 * 1000; // the problem archive barely changes day to day

  function loadProblemsetCache() {
    try {
      const raw = localStorage.getItem(PROBLEMSET_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > PROBLEMSET_TTL_MS) return null;
      return parsed.problems;
    } catch (e) {
      return null;
    }
  }

  function saveProblemsetCache(problems) {
    try {
      localStorage.setItem(PROBLEMSET_CACHE_KEY, JSON.stringify({ problems, timestamp: Date.now() }));
    } catch (e) {
      // localStorage may be unavailable/full; caching is a nice-to-have.
    }
  }

  function fetchProblemset() {
    const cached = loadProblemsetCache();
    if (cached) return Promise.resolve(cached);
    return fetchJSON("https://codeforces.com/api/problemset.problems").then((res) => {
      if (res.status !== "OK") throw new Error(res.comment || "Failed to load problem archive");
      const problems = res.result.problems.map((p) => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating || null,
        tags: p.tags || [],
      }));
      saveProblemsetCache(problems);
      return problems;
    });
  }

  // ================= FETCH =================
  function fetchJSON(url) {
    return fetch(url).then((r) => r.json());
  }

  function fetchAllData(handle) {
    return Promise.all([
      fetchJSON(`https://codeforces.com/api/user.status?handle=${handle}`),
      fetchJSON(`https://codeforces.com/api/user.rating?handle=${handle}`).catch(
        () => ({ status: "OK", result: [] })
      ),
      fetchJSON(`https://codeforces.com/api/user.info?handles=${handle}`).catch(
        () => ({ status: "OK", result: [null] })
      ),
    ]).then(([statusRes, ratingRes, infoRes]) => {
      if (statusRes.status !== "OK") {
        throw new Error(statusRes.comment || "Failed to load submissions");
      }
      return {
        status: statusRes.result,
        rating: ratingRes.status === "OK" ? ratingRes.result : [],
        info: infoRes.status === "OK" ? infoRes.result[0] : null,
      };
    });
  }

  function loadAndRender(handle, forceRefresh) {
    setLoading(true);
    clearError();

    const cached = !forceRefresh && loadCache(handle);
    if (cached) {
      applyData(cached, cached.timestamp);
      setLoading(false);
      // Refresh silently in the background so the view stays current.
      fetchAllData(handle)
        .then((fresh) => {
          saveCache(handle, fresh);
          applyData(fresh, Date.now());
        })
        .catch(() => {});
      return;
    }

    fetchAllData(handle)
      .then((fresh) => {
        saveCache(handle, fresh);
        applyData(fresh, Date.now());
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setError(`Couldn't load Codeforces data: ${err.message}`);
      });
  }

  // ================= DATA PROCESSING =================
  function resetState() {
    state.problems.clear();
    state.ratingCounts.clear();
    state.tagSolved.clear();
    state.tagAttempted.clear();
    state.verdictCounts.clear();
    state.languageCounts.clear();
    state.dailySolved.clear();
    state.ratingHistory = [];
    state.totalSubmissions = 0;
  }

  function processStatus(submissions) {
    state.totalSubmissions = submissions.length;

    submissions.forEach((sub) => {
      const verdict = sub.verdict || "TESTING";
      state.verdictCounts.set(verdict, (state.verdictCounts.get(verdict) || 0) + 1);

      const lang = sub.programmingLanguage || "Unknown";
      state.languageCounts.set(lang, (state.languageCounts.get(lang) || 0) + 1);

      const pid = `${sub.problem.contestId}-${sub.problem.index}`;
      let prob = state.problems.get(pid);
      if (!prob) {
        prob = {
          contestId: sub.problem.contestId,
          index: sub.problem.index,
          rating: sub.problem.rating,
          tags: sub.problem.tags || [],
          solved: false,
          attempts: 0,
          firstSolveTime: null,
        };
        state.problems.set(pid, prob);
      }
      prob.attempts++;
      if (sub.verdict === "OK") {
        prob.solved = true;
        if (prob.firstSolveTime === null || sub.creationTimeSeconds < prob.firstSolveTime) {
          prob.firstSolveTime = sub.creationTimeSeconds;
        }
      }
    });

    state.problems.forEach((prob) => {
      prob.tags.forEach((tag) => {
        state.tagAttempted.set(tag, (state.tagAttempted.get(tag) || 0) + 1);
      });

      if (!prob.solved) return;

      if (prob.rating) {
        state.ratingCounts.set(prob.rating, (state.ratingCounts.get(prob.rating) || 0) + 1);
      }

      const key = dayKey(new Date(prob.firstSolveTime * 1000));
      if (!state.dailySolved.has(key)) state.dailySolved.set(key, []);
      state.dailySolved.get(key).push({ contestId: prob.contestId, index: prob.index, rating: prob.rating || null });

      prob.tags.forEach((tag) => {
        state.tagSolved.set(tag, (state.tagSolved.get(tag) || 0) + 1);
      });
    });
  }

  function processRatingHistory(contestList) {
    state.ratingHistory = (contestList || [])
      .slice()
      .sort((a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds);
  }

  function applyData(data, timestamp) {
    resetState();
    processStatus(data.status);
    processRatingHistory(data.rating);
    state.userInfo = data.info;
    state.loaded = true;
    updateLastUpdatedLabel(timestamp);
    enableTabs(true);
    renderTabContent(state.activeTab);
  }

  // ================= STATS =================
  function ratingStats() {
    const entries = [...state.ratingCounts.entries()];
    if (entries.length === 0) return null;
    let totalSolved = 0, weightedSum = 0, maxRating = 0;
    const allRatings = [];
    entries.forEach(([rating, count]) => {
      totalSolved += count;
      weightedSum += rating * count;
      maxRating = Math.max(maxRating, rating);
      for (let i = 0; i < count; i++) allRatings.push(rating);
    });
    allRatings.sort((a, b) => a - b);
    return {
      totalSolved,
      avg: Math.round(weightedSum / totalSolved),
      median: allRatings[Math.floor(allRatings.length / 2)],
      max: maxRating,
    };
  }

  function computeStreaks() {
    const days = [...state.dailySolved.keys()].sort();
    if (days.length === 0) {
      return { current: 0, max: 0, mostActiveDay: null, mostActiveCount: 0, totalActiveDays: 0 };
    }

    let max = 1, run = 1;
    for (let i = 1; i < days.length; i++) {
      run = daysDiff(days[i - 1], days[i]) === 1 ? run + 1 : 1;
      max = Math.max(max, run);
    }

    let current = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let cursorKey = dayKey(cursor);
    if (!state.dailySolved.has(cursorKey)) {
      cursor.setDate(cursor.getDate() - 1);
      cursorKey = dayKey(cursor);
    }
    while (state.dailySolved.has(cursorKey)) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
      cursorKey = dayKey(cursor);
    }

    let mostActiveDay = null, mostActiveCount = 0;
    state.dailySolved.forEach((arr, key) => {
      if (arr.length > mostActiveCount) {
        mostActiveCount = arr.length;
        mostActiveDay = key;
      }
    });

    return { current, max, mostActiveDay, mostActiveCount, totalActiveDays: days.length };
  }

  // ================= CHART HELPERS =================
  function upsertChart(canvasId, config) {
    const existing = Chart.getChart(canvasId);
    if (existing) existing.destroy();
    const el = document.getElementById(canvasId);
    if (!el) return null;
    return new Chart(el.getContext("2d"), config);
  }

  function baseBarOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#e0e0e0" } },
        y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#e0e0e0" } },
      },
      plugins: { legend: { labels: { color: "#e0e0e0" } } },
    };
  }

  function baseDoughnutOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "right", labels: { color: "#e0e0e0", boxWidth: 12 } },
        tooltip: { backgroundColor: "#444", titleColor: "#e0e0e0", bodyColor: "#e0e0e0" },
      },
    };
  }

  // ================= RENDER: OVERVIEW =================
  function renderOverview() {
    const panel = document.getElementById("tab-overview");
    const rStats = ratingStats();
    const streaks = computeStreaks();
    const okCount = state.verdictCounts.get("OK") || 0;
    const acceptance = state.totalSubmissions
      ? ((okCount / state.totalSubmissions) * 100).toFixed(1)
      : "0.0";
    const info = state.userInfo;
    const solvedCount = [...state.problems.values()].filter((p) => p.solved).length;

    const cards = [
      { label: "Problems Solved", value: solvedCount },
      { label: "Total Submissions", value: state.totalSubmissions },
      { label: "Acceptance Rate", value: `${acceptance}%` },
      { label: "Current Streak", value: `${streaks.current}d` },
      { label: "Longest Streak", value: `${streaks.max}d` },
      { label: "Avg Rating Solved", value: rStats ? rStats.avg : "–" },
      { label: "Highest Solved", value: rStats ? rStats.max : "–" },
      { label: "Current Rating", value: info ? info.rating ?? "Unrated" : "–" },
      { label: "Contests Played", value: state.ratingHistory.length },
    ];

    panel.innerHTML = `
      <div class="cfa-stat-grid">
        ${cards
          .map(
            (c) => `
          <div class="cfa-stat-card">
            <div class="cfa-stat-value">${c.value}</div>
            <div class="cfa-stat-label">${c.label}</div>
          </div>`
          )
          .join("")}
      </div>
      <div class="cfa-chart-row">
        <div class="analytics-card cfa-half">
          <h3>Verdict Breakdown</h3>
          <div class="chart-container"><canvas id="verdictChart"></canvas></div>
        </div>
        <div class="analytics-card cfa-half">
          <h3>Language Usage</h3>
          <div class="chart-container"><canvas id="languageChart"></canvas></div>
        </div>
      </div>
    `;

    const verdictEntries = [...state.verdictCounts.entries()].sort((a, b) => b[1] - a[1]);
    upsertChart("verdictChart", {
      type: "doughnut",
      data: {
        labels: verdictEntries.map(([v]) => VERDICT_LABELS[v] || v),
        datasets: [{ data: verdictEntries.map(([, c]) => c), backgroundColor: TAG_COLORS, borderWidth: 0.5 }],
      },
      options: baseDoughnutOptions(),
    });

    const langEntries = [...state.languageCounts.entries()].sort((a, b) => b[1] - a[1]);
    const topLang = langEntries.slice(0, 8);
    const otherCount = langEntries.slice(8).reduce((s, [, c]) => s + c, 0);
    if (otherCount > 0) topLang.push(["Other", otherCount]);
    upsertChart("languageChart", {
      type: "bar",
      data: {
        labels: topLang.map(([l]) => l),
        datasets: [{ label: "Submissions", data: topLang.map(([, c]) => c), backgroundColor: "#58a6ff" }],
      },
      options: { ...baseBarOptions(), indexAxis: "y" },
    });
  }

  // ================= RENDER: RATING =================
  function renderRating() {
    const panel = document.getElementById("tab-rating");
    const rStats = ratingStats();
    const min = state.ratingFilter?.min ?? 800;
    const max = state.ratingFilter?.max ?? 3500;

    panel.innerHTML = `
      <div class="analytics-card">
        <h3>Problems Solved by Rating</h3>
        <div class="filter-group">
          <label>Min Rating: <input id="ratingMin" type="number" step="100" value="${min}"></label>
          <label>Max Rating: <input id="ratingMax" type="number" step="100" value="${max}"></label>
          <button id="ratingApplyFilter">Apply</button>
        </div>
        <div class="chart-container"><canvas id="problemRatingChart"></canvas></div>
        ${
          rStats
            ? `
        <div class="cfa-stat-grid cfa-stat-grid-compact">
          <div class="cfa-stat-card"><div class="cfa-stat-value">${rStats.totalSolved}</div><div class="cfa-stat-label">Rated Solved</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${rStats.avg}</div><div class="cfa-stat-label">Average</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${rStats.median}</div><div class="cfa-stat-label">Median</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${rStats.max}</div><div class="cfa-stat-label">Highest</div></div>
        </div>`
            : `<p class="cfa-empty">No rated problems solved yet.</p>`
        }
      </div>
    `;

    drawRatingChart();

    document.getElementById("ratingApplyFilter").addEventListener("click", () => {
      state.ratingFilter = {
        min: parseInt(document.getElementById("ratingMin").value) || 0,
        max: parseInt(document.getElementById("ratingMax").value) || 9999,
      };
      drawRatingChart();
    });
  }

  function drawRatingChart() {
    const min = state.ratingFilter?.min ?? 800;
    const max = state.ratingFilter?.max ?? 3500;
    const entries = [...state.ratingCounts.entries()]
      .filter(([r]) => r >= min && r <= max)
      .sort((a, b) => a[0] - b[0]);

    upsertChart("problemRatingChart", {
      type: "bar",
      data: {
        labels: entries.map(([r]) => r),
        datasets: [
          {
            label: "Problems Solved",
            data: entries.map(([, c]) => c),
            backgroundColor: entries.map(([r]) => ratingColor(r)),
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 0.75,
          },
        ],
      },
      options: baseBarOptions(),
    });
  }

  // ================= RENDER: TAGS =================
  function renderTags() {
    const panel = document.getElementById("tab-tags");
    const sortedSolved = [...state.tagSolved.entries()].sort((a, b) => b[1] - a[1]);
    const top = sortedSolved.slice(0, 10);
    const otherCount = sortedSolved.slice(10).reduce((s, [, c]) => s + c, 0);
    const chartLabels = top.map(([t]) => t).concat(otherCount > 0 ? ["Other"] : []);
    const chartData = top.map(([, c]) => c).concat(otherCount > 0 ? [otherCount] : []);

    const allTagNames = new Set([...state.tagSolved.keys(), ...state.tagAttempted.keys()]);
    const tagRows = [...allTagNames]
      .map((tag) => {
        const solved = state.tagSolved.get(tag) || 0;
        const attempted = state.tagAttempted.get(tag) || 0;
        return { tag, solved, attempted, rate: attempted ? solved / attempted : 0 };
      })
      .sort((a, b) => b.solved - a.solved);

    const focusAreas = tagRows
      .filter((t) => t.attempted >= 3 && t.rate < 0.5)
      .sort((a, b) => b.attempted - a.attempted)
      .slice(0, 5);

    panel.innerHTML = `
      <div class="analytics-card">
        <h3>Tags Solved</h3>
        <div class="chart-container"><canvas id="tagChart"></canvas></div>
        <div class="tag-list-container">
          <ul class="tag-list">
            ${tagRows
              .map(
                (t, i) => `
              <li>
                <svg width="12" height="12"><rect width="12" height="12" style="fill:${TAG_COLORS[i % TAG_COLORS.length]};stroke-width:1;stroke:rgb(0,0,0)" /></svg>
                <span>${t.tag}: ${t.solved}${t.attempted > t.solved ? ` <span class="cfa-text-dim">(${t.attempted} attempted)</span>` : ""}</span>
              </li>`
              )
              .join("")}
          </ul>
        </div>
      </div>
      ${
        focusAreas.length
          ? `
      <div class="analytics-card">
        <h3>Focus Areas</h3>
        <p class="cfa-text-dim">Tags with the most attempted-but-unsolved problems &mdash; good places to practice next.</p>
        <ul class="cfa-focus-list">
          ${focusAreas
            .map((t) => `<li>${t.tag} &mdash; ${t.solved}/${t.attempted} solved (${Math.round(t.rate * 100)}%)</li>`)
            .join("")}
        </ul>
      </div>`
          : ""
      }
    `;

    upsertChart("tagChart", {
      type: "doughnut",
      data: { labels: chartLabels, datasets: [{ data: chartData, backgroundColor: TAG_COLORS, borderWidth: 0.5 }] },
      options: baseDoughnutOptions(),
    });
  }

  // ================= RENDER: ACTIVITY =================
  function renderActivity() {
    const panel = document.getElementById("tab-activity");
    const streaks = computeStreaks();
    panel.innerHTML = `
      <div class="analytics-card heatmap-container">
        <h3>Submission Activity (last 12 months)</h3>
        <div class="cfa-heatmap-scroll">
          <canvas id="ratingHeatmapCanvas"></canvas>
        </div>
        <div id="heatmapTooltip"></div>
        <div class="cfa-stat-grid cfa-stat-grid-compact">
          <div class="cfa-stat-card"><div class="cfa-stat-value">${streaks.current}</div><div class="cfa-stat-label">Current Streak</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${streaks.max}</div><div class="cfa-stat-label">Longest Streak</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${streaks.totalActiveDays}</div><div class="cfa-stat-label">Active Days</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${streaks.mostActiveCount}</div><div class="cfa-stat-label">Best Day${streaks.mostActiveDay ? ` (${streaks.mostActiveDay})` : ""}</div></div>
        </div>
      </div>
    `;
    drawHeatmap();
  }

  function drawHeatmap() {
    const canvas = document.getElementById("ratingHeatmapCanvas");
    if (!canvas) return;
    const scrollWrap = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    const tooltip = document.getElementById("heatmapTooltip");

    // Local calendar day, matching the user's own wall clock — using UTC
    // here previously meant "today" (and every bucketed submission) could
    // land on the wrong side of midnight depending on timezone, making
    // recent solves appear to be "in the future".
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setMonth(start.getMonth() - 12);
    start.setDate(start.getDate() - start.getDay());

    const cellSize = 11, padding = 3, leftGutter = 26, topGutter = 16;
    const totalDays = Math.round((today - start) / 86400000) + 1;
    const columns = Math.ceil(totalDays / 7);

    canvas.width = leftGutter + columns * (cellSize + padding) + padding;
    canvas.height = topGutter + 7 * (cellSize + padding) + padding;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#8b949e";
    ["Mon", "Wed", "Fri"].forEach((label, idx) => {
      const row = idx * 2 + 1;
      ctx.fillText(label, 0, topGutter + row * (cellSize + padding) + cellSize - 2);
    });

    // Column 0 = oldest week (12 months ago, left edge); the column keeps
    // growing as the loop walks forward day by day, so "today" always ends
    // up in the last (rightmost) column.
    const positions = [];
    let lastMonth = -1;
    let col = 0;
    for (const cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
      const row = cursor.getDay();
      if (row === 0 && cursor.getMonth() !== lastMonth) {
        lastMonth = cursor.getMonth();
        ctx.fillStyle = "#8b949e";
        ctx.fillText(
          cursor.toLocaleString("en-US", { month: "short" }),
          leftGutter + col * (cellSize + padding),
          topGutter - 4
        );
      }

      const key = dayKey(cursor);
      let color = "#1e1e1e", avg = null, count = 0, dayProblems = [];
      if (state.dailySolved.has(key)) {
        dayProblems = state.dailySolved.get(key);
        const rated = dayProblems.filter((p) => p.rating);
        avg = rated.length ? rated.reduce((a, p) => a + p.rating, 0) / rated.length : null;
        color = avg !== null ? ratingColor(avg) : "#4d4d4d";
        count = dayProblems.length;
      }
      ctx.fillStyle = color;
      const px = leftGutter + col * (cellSize + padding) + padding;
      const py = topGutter + row * (cellSize + padding) + padding;
      ctx.fillRect(px, py, cellSize, cellSize);
      positions.push({ x: px, y: py, w: cellSize, h: cellSize, date: key, avg, count, problems: dayProblems });

      if (row === 6) col++;
    }

    // Jump straight to the most recent activity instead of leaving the
    // scroll position on the oldest (leftmost) week.
    scrollWrap.scrollLeft = scrollWrap.scrollWidth;

    let hideTimeout = null;
    const showTooltip = (found, clientX, clientY) => {
      clearTimeout(hideTimeout);
      tooltip.style.display = "block";
      tooltip.style.left = clientX + 15 + "px";
      tooltip.style.top = clientY + 15 + "px";
      tooltip.innerHTML = buildHeatmapTooltip(found);
    };
    const scheduleHide = () => {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        tooltip.style.display = "none";
      }, 150);
    };

    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const found = positions.find((p) => mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h);
      if (found) showTooltip(found, e.clientX, e.clientY);
      else scheduleHide();
    };
    canvas.onmouseleave = scheduleHide;
    // Keep the tooltip open while the cursor moves onto it so its problem
    // links are actually clickable, not just visible.
    tooltip.onmouseenter = () => clearTimeout(hideTimeout);
    tooltip.onmouseleave = scheduleHide;
  }

  function buildHeatmapTooltip(found) {
    if (!found.count) {
      return `<strong>${found.date}</strong><br/><span class="cfa-text-dim">No problems solved</span>`;
    }
    const shown = found.problems.slice(0, 10);
    const links = shown
      .map((p) => `<a href="${findProblemURL(p.contestId, p.index)}" target="_blank" rel="noopener">${p.contestId}${p.index}</a>`)
      .join(", ");
    const extra = found.problems.length > shown.length ? ` +${found.problems.length - shown.length} more` : "";
    return `<strong>${found.date}</strong> &middot; ${found.count} solved<br/>${links}${extra}`;
  }

  // ================= RENDER: CONTESTS =================
  function renderContests() {
    const panel = document.getElementById("tab-contests");
    if (state.ratingHistory.length === 0) {
      panel.innerHTML = `<div class="analytics-card"><h3>Rating History</h3><p class="cfa-empty">No rated contests yet.</p></div>`;
      return;
    }

    const info = state.userInfo;
    const bestRank = Math.min(...state.ratingHistory.map((c) => c.rank));

    panel.innerHTML = `
      <div class="analytics-card">
        <h3>Rating History</h3>
        <div class="chart-container"><canvas id="contestRatingChart"></canvas></div>
        <div class="cfa-stat-grid cfa-stat-grid-compact">
          <div class="cfa-stat-card"><div class="cfa-stat-value">${info?.rating ?? "–"}</div><div class="cfa-stat-label">Current Rating</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${info?.maxRating ?? "–"}</div><div class="cfa-stat-label">Max Rating</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${state.ratingHistory.length}</div><div class="cfa-stat-label">Contests</div></div>
          <div class="cfa-stat-card"><div class="cfa-stat-value">${bestRank}</div><div class="cfa-stat-label">Best Rank</div></div>
        </div>
      </div>
    `;

    upsertChart("contestRatingChart", {
      type: "line",
      data: {
        labels: state.ratingHistory.map((c) => c.contestName),
        datasets: [
          {
            label: "Rating",
            data: state.ratingHistory.map((c) => c.newRating),
            borderColor: "#58a6ff",
            backgroundColor: "rgba(88,166,255,0.15)",
            pointBackgroundColor: state.ratingHistory.map((c) => ratingColor(c.newRating)),
            pointRadius: 3,
            fill: true,
            tension: 0.15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#e0e0e0", autoSkip: true, maxRotation: 0 } },
          y: { grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#e0e0e0" } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#444",
            titleColor: "#e0e0e0",
            bodyColor: "#e0e0e0",
            callbacks: {
              afterBody: (items) => {
                const c = state.ratingHistory[items[0].dataIndex];
                const delta = c.newRating - c.oldRating;
                return `Rank: ${c.rank}\nChange: ${delta >= 0 ? "+" : ""}${delta}`;
              },
            },
          },
        },
      },
    });
  }

  // ================= RENDER: UNSOLVED =================
  function renderUnsolved() {
    const panel = document.getElementById("tab-unsolved");
    const allTags = [...new Set([...state.problems.values()].flatMap((p) => p.tags))].sort();
    const f = state.unsolvedFilters;

    panel.innerHTML = `
      <div class="analytics-card">
        <h3>Unsolved Problems</h3>
        <div class="filter-group">
          <label>Min Rating: <input id="unsolvedMin" type="number" step="100" value="${f.minRating}"></label>
          <label>Max Rating: <input id="unsolvedMax" type="number" step="100" value="${f.maxRating}"></label>
          <label>Tag:
            <select id="unsolvedTag">
              <option value="">All</option>
              ${allTags.map((t) => `<option value="${t}" ${f.tag === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </label>
          <label>Sort:
            <select id="unsolvedSort">
              <option value="rating-asc" ${f.sort === "rating-asc" ? "selected" : ""}>Rating &uarr;</option>
              <option value="rating-desc" ${f.sort === "rating-desc" ? "selected" : ""}>Rating &darr;</option>
            </select>
          </label>
          <button id="unsolvedApplyFilter">Apply</button>
        </div>
        <p id="unsolvedCount" class="cfa-text-dim"></p>
        <div id="unsolvedList" class="unsolved-problem-list"></div>
      </div>
      <div class="analytics-card">
        <h3>Recommended Practice</h3>
        <p class="cfa-text-dim">Unsolved problems near your current rating.</p>
        <div id="recommendedList" class="unsolved-problem-list"></div>
      </div>
    `;

    renderUnsolvedList();
    renderRecommended();

    document.getElementById("unsolvedApplyFilter").addEventListener("click", () => {
      state.unsolvedFilters = {
        minRating: document.getElementById("unsolvedMin").value,
        maxRating: document.getElementById("unsolvedMax").value,
        tag: document.getElementById("unsolvedTag").value,
        sort: document.getElementById("unsolvedSort").value,
      };
      renderUnsolvedList();
    });
  }

  function renderUnsolvedList() {
    const f = state.unsolvedFilters;
    const min = f.minRating === "" ? -Infinity : parseInt(f.minRating);
    const max = f.maxRating === "" ? Infinity : parseInt(f.maxRating);
    const hasRatingFilter = f.minRating !== "" || f.maxRating !== "";

    let list = [...state.problems.values()].filter((p) => !p.solved);
    if (f.tag) list = list.filter((p) => p.tags.includes(f.tag));
    list = list.filter((p) => (p.rating ? p.rating >= min && p.rating <= max : !hasRatingFilter));
    list.sort((a, b) => {
      const ra = a.rating || 0, rb = b.rating || 0;
      return f.sort === "rating-desc" ? rb - ra : ra - rb;
    });

    document.getElementById("unsolvedCount").textContent = `${list.length} problem${list.length === 1 ? "" : "s"}`;
    document.getElementById("unsolvedList").innerHTML = list
      .map(
        (p) => `
      <a class="unsolved_problem" href="${findProblemURL(p.contestId, p.index)}" target="_blank" rel="noopener">
        ${p.contestId}-${p.index}${p.rating ? ` <span class="cfa-rating-badge" style="color:${ratingColor(p.rating)}">${p.rating}</span>` : ""}
      </a>`
      )
      .join("");
  }

  function renderRecommended() {
    const target = state.userInfo?.rating || ratingStats()?.avg || 1200;
    const list = [...state.problems.values()]
      .filter((p) => !p.solved && p.rating)
      .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target))
      .slice(0, 12)
      .sort((a, b) => a.rating - b.rating);

    document.getElementById("recommendedList").innerHTML = list.length
      ? list
          .map(
            (p) => `
        <a class="unsolved_problem" href="${findProblemURL(p.contestId, p.index)}" target="_blank" rel="noopener">
          ${p.contestId}-${p.index} <span class="cfa-rating-badge" style="color:${ratingColor(p.rating)}">${p.rating}</span>
        </a>`
          )
          .join("")
      : `<p class="cfa-empty">Nothing to recommend right now.</p>`;
  }

  // ================= RENDER: PRACTICE (POTD + Mashup) =================
  function isSolvedProblem(p) {
    return !!state.problems.get(`${p.contestId}-${p.index}`)?.solved;
  }

  function solvedToday(p) {
    const entry = state.problems.get(`${p.contestId}-${p.index}`);
    if (!entry?.solved || !entry.firstSolveTime) return false;
    return dayKey(new Date(entry.firstSolveTime * 1000)) === dayKey(new Date());
  }

  // Solved on some earlier day — used to build the POTD pool so that
  // solving today's pick doesn't make it disappear and get swapped out
  // from under the "already solved today" checkmark.
  function solvedBeforeToday(p) {
    const entry = state.problems.get(`${p.contestId}-${p.index}`);
    if (!entry?.solved || !entry.firstSolveTime) return false;
    return dayKey(new Date(entry.firstSolveTime * 1000)) !== dayKey(new Date());
  }

  function filterProblemset(filters) {
    const min = filters.minRating === "" || filters.minRating == null ? -Infinity : parseInt(filters.minRating);
    const max = filters.maxRating === "" || filters.maxRating == null ? Infinity : parseInt(filters.maxRating);
    const tags = filters.tags || [];
    return state.problemset.filter((p) => {
      if (!p.rating) return false;
      if (p.rating < min || p.rating > max) return false;
      if (tags.length && !tags.some((t) => p.tags.includes(t))) return false;
      return !isSolvedProblem(p);
    });
  }

  function renderProblemCard(p) {
    if (!p) return `<p class="cfa-empty">No problem matches those filters.</p>`;
    return `
      <div class="cfa-problem-card">
        <div class="cfa-problem-card-header">
          <a href="${findProblemURL(p.contestId, p.index)}" target="_blank" rel="noopener">${p.contestId}${p.index} &mdash; ${p.name}</a>
          <span class="cfa-rating-badge" style="color:${ratingColor(p.rating)}">${p.rating}</span>
        </div>
        <div class="cfa-problem-card-tags">${p.tags.map((t) => `<span class="cfa-tag-chip">${t}</span>`).join("")}</div>
      </div>
    `;
  }

  function renderPractice() {
    const panel = document.getElementById("tab-practice");

    if (!state.problemset && !state.problemsetLoading && !state.problemsetError) {
      state.problemsetLoading = true;
      fetchProblemset()
        .then((list) => {
          state.problemset = list;
        })
        .catch((err) => {
          state.problemsetError = err.message;
        })
        .finally(() => {
          state.problemsetLoading = false;
          if (state.activeTab === "practice") renderPractice();
        });
    }

    if (state.problemsetLoading) {
      panel.innerHTML = `<div class="analytics-card"><div class="cfa-status cfa-status-loading"><div class="cfa-spinner"></div><span>Loading the Codeforces problem archive&hellip;</span></div></div>`;
      return;
    }
    if (state.problemsetError) {
      panel.innerHTML = `<div class="analytics-card"><p class="cfa-status-error">⚠️ ${state.problemsetError}</p><button id="practiceRetry" class="cfa-btn">Retry</button></div>`;
      document.getElementById("practiceRetry").addEventListener("click", () => {
        state.problemsetError = null;
        renderPractice();
      });
      return;
    }
    if (!state.problemset) return; // fetch just kicked off; the .finally() above will re-render

    const today = dayKey(new Date());
    const userRating = state.userInfo?.rating || ratingStats()?.avg || 1200;
    const inRange = (p, min, max) => p.rating && p.rating >= min && p.rating <= max && !solvedBeforeToday(p);
    const nearRatingPool = state.problemset.filter((p) => inRange(p, userRating - 100, userRating + 300));
    const standardPool = nearRatingPool.length ? nearRatingPool : state.problemset.filter((p) => inRange(p, -Infinity, Infinity));
    const standardPick = seededPick(standardPool, `potd-${today}`);

    const pf = state.potdFilters;
    const customPool = filterProblemset({ minRating: pf.minRating, maxRating: pf.maxRating, tags: pf.tag ? [pf.tag] : [] });
    const customPick = seededPick(customPool, `potd-${today}-${pf.minRating}-${pf.maxRating}-${pf.tag}-${state.potdShuffleSeed}`);

    const mf = state.mashupFilters;
    const mashupPool = filterProblemset({ minRating: mf.minRating, maxRating: mf.maxRating, tags: mf.tags });
    const mashupPicks = seededSample(mashupPool, mf.count, `mashup-${today}-${mf.minRating}-${mf.maxRating}-${mf.tags.join(",")}-${state.mashupSeed}`);

    const allTags = [...new Set(state.problemset.flatMap((p) => p.tags))].sort();

    panel.innerHTML = `
      <div class="analytics-card">
        <h3>Problem of the Day</h3>
        <p class="cfa-text-dim">Picked near your current rating (${userRating}) &mdash; same problem all day, a new one tomorrow.</p>
        ${renderProblemCard(standardPick)}
        ${standardPick && solvedToday(standardPick) ? `<p class="cfa-text-dim">✅ Already solved today!</p>` : ""}
      </div>

      <div class="analytics-card">
        <h3>Custom Problem of the Day</h3>
        <p class="cfa-text-dim">Set your own rating range and tag; Shuffle swaps in another match right now.</p>
        <div class="filter-group">
          <label>Min Rating: <input id="potdMin" type="number" step="100" value="${pf.minRating}"></label>
          <label>Max Rating: <input id="potdMax" type="number" step="100" value="${pf.maxRating}"></label>
          <label>Tag:
            <select id="potdTag">
              <option value="">Any</option>
              ${allTags.map((t) => `<option value="${t}" ${pf.tag === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </label>
          <button id="potdApply">Apply</button>
          <button id="potdShuffle" class="cfa-btn">&#128256; Shuffle</button>
        </div>
        ${renderProblemCard(customPick)}
      </div>

      <div class="analytics-card">
        <h3>Mashup Generator</h3>
        <p class="cfa-text-dim">A themed mini practice set &mdash; pick tags, a rating range, and how many problems.</p>
        <div class="filter-group">
          <label>Min Rating: <input id="mashupMin" type="number" step="100" value="${mf.minRating}"></label>
          <label>Max Rating: <input id="mashupMax" type="number" step="100" value="${mf.maxRating}"></label>
          <label>Count: <input id="mashupCount" type="number" min="1" max="10" value="${mf.count}"></label>
          <label>Tags (any of):
            <select id="mashupTags" multiple size="4">
              ${allTags.map((t) => `<option value="${t}" ${mf.tags.includes(t) ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </label>
          <button id="mashupGenerate">Generate Mashup</button>
        </div>
        <div class="cfa-problem-grid">
          ${mashupPicks.length ? mashupPicks.map((p) => renderProblemCard(p)).join("") : `<p class="cfa-empty">No problems match those filters.</p>`}
        </div>
      </div>
    `;

    document.getElementById("potdApply").addEventListener("click", () => {
      state.potdFilters = {
        minRating: document.getElementById("potdMin").value,
        maxRating: document.getElementById("potdMax").value,
        tag: document.getElementById("potdTag").value,
      };
      renderPractice();
    });
    document.getElementById("potdShuffle").addEventListener("click", () => {
      state.potdShuffleSeed++;
      renderPractice();
    });
    document.getElementById("mashupGenerate").addEventListener("click", () => {
      const tagsSelect = document.getElementById("mashupTags");
      state.mashupFilters = {
        minRating: document.getElementById("mashupMin").value,
        maxRating: document.getElementById("mashupMax").value,
        count: Math.min(10, Math.max(1, parseInt(document.getElementById("mashupCount").value) || 5)),
        tags: [...tagsSelect.selectedOptions].map((o) => o.value),
      };
      state.mashupSeed++;
      renderPractice();
    });
  }

  // ================= RENDER: RESOURCES =================
  function renderResources() {
    const panel = document.getElementById("tab-resources");
    panel.innerHTML = `
      <div class="analytics-card">
        <h3>Guides &amp; Other CP Sites</h3>
        <p class="cfa-text-dim">A short list of resources worth bookmarking.</p>
        ${RESOURCE_GROUPS.map(
          (group) => `
          <div class="cfa-resource-group">
            <h4>${group.title}</h4>
            <ul class="cfa-resource-list">
              ${group.links
                .map(
                  (l) => `
                <li>
                  <a href="${l.url}" target="_blank" rel="noopener">${l.name}</a>
                  <span class="cfa-text-dim"> &mdash; ${l.note}</span>
                </li>`
                )
                .join("")}
            </ul>
          </div>`
        ).join("")}
      </div>
    `;
  }

  // ================= TABS / SCAFFOLD =================
  function renderTabContent(tabId) {
    if (!state.loaded) return;
    switch (tabId) {
      case "overview": renderOverview(); break;
      case "rating": renderRating(); break;
      case "tags": renderTags(); break;
      case "activity": renderActivity(); break;
      case "contests": renderContests(); break;
      case "unsolved": renderUnsolved(); break;
      case "practice": renderPractice(); break;
      case "resources": renderResources(); break;
    }
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll(".cfa-tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));
    document.querySelectorAll(".cfa-panel").forEach((p) => p.classList.toggle("active", p.dataset.tab === tabId));
    renderTabContent(tabId);
  }

  function enableTabs(enabled) {
    document.querySelectorAll(".cfa-tab-btn").forEach((btn) => {
      btn.disabled = !enabled;
    });
  }

  function setLoading(isLoading) {
    const el = document.getElementById("cfaStatus");
    if (isLoading) {
      el.innerHTML = `<div class="cfa-spinner"></div><span>Loading Codeforces data&hellip;</span>`;
      el.className = "cfa-status cfa-status-loading";
    } else {
      el.innerHTML = "";
      el.className = "cfa-status";
    }
  }

  function setError(message) {
    const el = document.getElementById("cfaStatus");
    el.innerHTML = `⚠️ ${message}`;
    el.className = "cfa-status cfa-status-error";
  }

  function clearError() {
    const el = document.getElementById("cfaStatus");
    if (el.className.includes("error")) {
      el.innerHTML = "";
      el.className = "cfa-status";
    }
  }

  function updateLastUpdatedLabel(timestamp) {
    const el = document.getElementById("cfaLastUpdated");
    const mins = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
    el.textContent = mins === 0 ? "Updated just now" : `Updated ${mins}m ago`;
  }

  function buildScaffold() {
    const styleTag = document.createElement("style");
    styleTag.textContent = CSS;
    document.head.appendChild(styleTag);

    const root = document.createElement("div");
    root.className = "cfa-root";
    root.innerHTML = `
      <div class="cfa-header">
        <h2 class="cfa-title">CF Analytics</h2>
        <div class="cfa-header-actions">
          <span id="cfaLastUpdated" class="cfa-last-updated"></span>
          <button id="cfaRefreshBtn" class="cfa-btn" type="button">&#8635; Refresh</button>
          <button id="cfaCollapseBtn" class="cfa-btn" type="button">&#9662;</button>
        </div>
      </div>
      <div id="cfaBody" class="cfa-body">
        <div id="cfaStatus" class="cfa-status"></div>
        <div class="cfa-tabbar" id="cfaTabbar">
          ${TABS.map((t) => `<button class="cfa-tab-btn${t.id === "overview" ? " active" : ""}" data-tab="${t.id}" type="button">${t.label}</button>`).join("")}
        </div>
        <div class="cfa-panels">
          ${TABS.map((t) => `<div class="cfa-panel${t.id === "overview" ? " active" : ""}" id="tab-${t.id}" data-tab="${t.id}"></div>`).join("")}
        </div>
      </div>
    `;

    document.querySelector("#pageContent").appendChild(root);

    root.querySelectorAll(".cfa-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.getElementById("cfaRefreshBtn").addEventListener("click", () => {
      loadAndRender(state.handle, true);
    });

    const collapseBtn = document.getElementById("cfaCollapseBtn");
    const body = document.getElementById("cfaBody");
    const collapsed = localStorage.getItem("cfAnalyticsCollapsed") === "1";
    if (collapsed) {
      body.style.display = "none";
      collapseBtn.innerHTML = "&#9656;";
    }
    collapseBtn.addEventListener("click", () => {
      const isHidden = body.style.display === "none";
      body.style.display = isHidden ? "" : "none";
      collapseBtn.innerHTML = isHidden ? "&#9662;" : "&#9656;";
      localStorage.setItem("cfAnalyticsCollapsed", isHidden ? "0" : "1");
    });

    enableTabs(false);
  }

  // ================= INIT =================
  function init() {
    const pageContent = document.querySelector("#pageContent");
    if (!pageContent) return;

    state.handle = getProfileIdFromUrl(window.location.href);
    buildScaffold();
    loadAndRender(state.handle, false);

    window.addEventListener(
      "resize",
      debounce(() => {
        if (state.loaded && state.activeTab === "activity") drawHeatmap();
      }, 200)
    );
  }

  init();
})();
