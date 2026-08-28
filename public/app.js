const names = new Map([
  ["YUNQUE", "云雀"], ["NIULAI", "牛来"], ["NIULAI_MAMA", "牛来妈妈"], ["BAOLA", "豹拉"]
]);

const titles = {
  "paper-tp": "纸面止盈路径",
  "paper-sl": "纸面止损路径",
  "observe-boomerang": "不足三票的观察 / 回旋镖"
};

function text(id, value) { document.querySelector(id).textContent = value; }

function renderFixture(data, key) {
  text("#fixture-title", titles[key]);
  text("#candidate-name", `${data.candidate.name} / ${data.candidate.symbol}`);
  text("#candidate-id", data.candidate.contract_id);
  text("#freshness", `${data.candidate.freshness_seconds}s freshness`);
  const metricNames = { views: "views", kol_count: "candidates", volume_5m_units: "5m volume", liquidity_units: "liquidity" };
  document.querySelector("#metrics").innerHTML = Object.entries(data.candidate.metrics)
    .map(([keyName, value]) => `<div class="metric"><small>${metricNames[keyName]}</small><strong>${value.toLocaleString()}</strong></div>`).join("");
  document.querySelector("#claims").innerHTML = data.evidence
    .map((claim) => `<div class="claim" data-type="${claim.claim_type}"><strong>${claim.claim_type}</strong>${claim.text}</div>`).join("");
  text("#vote-score", `${data.vote_round.buy_votes}/4`);
  text("#decision-copy", data.vote_round.decision === "PAPER_BUY" ? "达到 3/4，牛来只建立 PAPER_ONLY 仓位。" : "不足三票，不开仓；进入只读观察。" );
  document.querySelector("#votes").innerHTML = data.vote_round.votes
    .map((vote) => `<div class="vote"><span>${names.get(vote.role)}</span><b data-vote="${vote.vote}">${vote.vote}</b></div>`).join("");
  document.querySelector("#timeline").innerHTML = data.timeline.map((event) => `
    <li class="timeline-item">
      <span class="timeline-index">${String(event.sequence).padStart(2, "0")}</span>
      <span class="timeline-meta"><strong>${event.kind}</strong><span>${event.role ? names.get(event.role) : "系统"} · ${event.claim_type}</span></span>
      <span class="timeline-body">${event.body}</span>
    </li>`).join("");
}

async function loadFixture(key) {
  const response = await fetch(`/api/fixtures/${key}`, { method: "GET" });
  if (!response.ok) throw new Error("fixture unavailable");
  renderFixture(await response.json(), key);
}

async function loadLab() {
  const response = await fetch("/api/safety-lab", { method: "GET" });
  const data = await response.json();
  document.querySelector("#lab-body").innerHTML = data.scenarios.map((scenario) => `
    <tr><td>${scenario.id}</td><td><code>${scenario.final_state.terminal_status}</code></td><td>${scenario.transport_calls.length}</td><td>${scenario.safety.external_side_effect ? "yes" : "no"}</td></tr>`).join("");
}

for (const button of document.querySelectorAll("[data-fixture]")) {
  button.addEventListener("click", async () => {
    document.querySelectorAll("[data-fixture]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-selected", item === button ? "true" : "false");
    });
    await loadFixture(button.dataset.fixture);
  });
}

try {
  await Promise.all([loadFixture("paper-tp"), loadLab()]);
} catch {
  text("#fixture-title", "本地 fixture 载入失败");
}
