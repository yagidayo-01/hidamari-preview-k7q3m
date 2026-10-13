/* ===== 予約カレンダーの設定（ここを書き換えて空き状況を更新） =====
   timeSlots   : 1日の予約枠
   closedDays  : 定休の曜日（0=日, 1=月 … 6=土）
   holidays    : 臨時のお休み日
   booked      : 予約済みの枠  "YYYY-MM-DD": ["10:00", ...]
   monthsAhead : 何か月先まで予約を受け付けるか
*/
const BOOKING = {
  timeSlots: ["10:00", "11:30", "13:30", "15:00"],
  closedDays: [0, 3],
  holidays: ["2026-10-20", "2026-11-03"],
  booked: {
    "2026-10-15": ["10:00", "11:30"],
    "2026-10-16": ["10:00", "11:30", "13:30", "15:00"],
    "2026-10-22": ["13:30", "15:00", "10:00"]
  },
  monthsAhead: 2
};

/* 予約カレンダー（contact.html のみ） */
(function () {
  const grid = document.getElementById("calGrid");
  if (!grid) return;
  const pad = n => String(n).padStart(2, "0");
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dows = ["日", "月", "火", "水", "木", "金", "土"];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const view = new Date(first);
  let selDate = null, selTime = null;

  const $ = id => document.getElementById(id);
  const slotList = $("slotList"), menu = $("menuSelect");

  // 料金ページから来たときはメニューを選んだ状態にする（contact.html?menu=baby など）
  const preset = { baby: 1, kids: 2, adult: 3 }[new URLSearchParams(location.search).get("menu")];
  if (preset) menu.selectedIndex = preset;

  function status(d) {
    const k = key(d);
    if (d <= today || BOOKING.closedDays.includes(d.getDay()) || BOOKING.holidays.includes(k)) return "closed";
    const left = BOOKING.timeSlots.length - (BOOKING.booked[k] || []).length;
    if (left <= 0) return "full";
    return left === 1 ? "few" : "open";
  }

  function render() {
    $("monthLabel").textContent = `${view.getFullYear()}年 ${view.getMonth() + 1}月`;
    const months = (view.getFullYear() - first.getFullYear()) * 12 + view.getMonth() - first.getMonth();
    $("prevMonth").disabled = months <= 0;
    $("nextMonth").disabled = months >= BOOKING.monthsAhead;
    grid.innerHTML = dows.map(w => `<div class="dow">${w}</div>`).join("");
    for (let i = 0; i < view.getDay(); i++) grid.insertAdjacentHTML("beforeend", "<div></div>");
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let n = 1; n <= days; n++) {
      const d = new Date(view.getFullYear(), view.getMonth(), n);
      const s = status(d);
      const mark = { open: "◎", few: "△", full: "×", closed: "－" }[s];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "day" + (s === "open" || s === "few" ? " open" : "") + (s === "few" ? " few" : "") + (s === "full" ? " full" : "");
      if (selDate && key(d) === key(selDate)) b.classList.add("selected");
      b.disabled = !(s === "open" || s === "few");
      b.innerHTML = `${n}<span class="mark">${mark}</span>`;
      b.addEventListener("click", () => { selDate = d; selTime = null; render(); renderSlots(); });
      grid.appendChild(b);
    }
  }

  function renderSlots() {
    if (!selDate) return;
    $("slotTitle").textContent = `${selDate.getMonth() + 1}月${selDate.getDate()}日（${dows[selDate.getDay()]}）`;
    const taken = BOOKING.booked[key(selDate)] || [];
    slotList.innerHTML = "";
    BOOKING.timeSlots.forEach(t => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = t;
      b.disabled = taken.includes(t);
      if (t === selTime) b.classList.add("selected");
      b.addEventListener("click", () => { selTime = t; renderSlots(); });
      slotList.appendChild(b);
    });
    update();
  }

  function message() {
    return `【ご予約希望】\n日時：${selDate.getMonth() + 1}月${selDate.getDate()}日（${dows[selDate.getDay()]}）${selTime}〜\nメニュー：${menu.value}\nお名前：\n（赤ちゃんの場合）月齢：`;
  }

  function update() {
    const ready = selDate && selTime && menu.value;
    $("bookBtn").setAttribute("aria-disabled", ready ? "false" : "true");
    $("summary").textContent = ready ? message() : "日時とメニューを選ぶと、ここに予約内容が出ます。";
  }

  menu.addEventListener("change", update);
  $("bookBtn").addEventListener("click", () => {
    try { navigator.clipboard.writeText(message()); $("copied").textContent = "予約内容をコピーしました。DMに貼り付けて送ってください。"; } catch (e) {}
  });
  $("prevMonth").addEventListener("click", () => { view.setMonth(view.getMonth() - 1); render(); });
  $("nextMonth").addEventListener("click", () => { view.setMonth(view.getMonth() + 1); render(); });
  render();
})();
