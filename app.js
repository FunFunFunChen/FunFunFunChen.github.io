const messageInput = document.querySelector("#teacherMessage");
const summaryList = document.querySelector("#summaryList");
const replyDraft = document.querySelector("#replyDraft");
const replyStatus = document.querySelector("#replyStatus");
const reminderText = document.querySelector("#reminderText");
const toast = document.querySelector("#toast");

const sampleMessage =
  "各位家長您好，明天自然課會進行植物觀察，請孩子攜帶一個透明塑膠杯和一張廚房紙巾。週五前也請繳交戶外教學費用 250 元，謝謝配合。";

const templates = {
  sick: "老師您好，孩子今天身體不舒服，需要請病假一天，麻煩老師協助留意課堂進度，謝謝老師。",
  absence: "老師您好，孩子因家中有事需要請事假，若有當天作業或注意事項，再麻煩老師告知，謝謝。",
  forgot: "老師您好，孩子今天忘記攜帶指定物品，我們會提醒孩子明天補帶，也謝謝老師協助。",
  thanks: "老師您好，謝謝您今天的提醒與照顧，我們會在家協助孩子配合。",
  payment: "老師您好，費用通知已收到，我們會在期限前協助孩子繳交，謝謝老師提醒。"
};

let selectedTone = "polite";
let lastReminder = "";

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function detectItems(text) {
  const candidates = [
    "透明塑膠杯",
    "廚房紙巾",
    "聯絡簿",
    "回條",
    "水壺",
    "餐具",
    "鉛筆盒",
    "美勞用品",
    "照片",
    "健保卡",
    "雨衣"
  ];

  return candidates.filter((item) => text.includes(item));
}

function detectDate(text) {
  const matches = text.match(/(今天|明天|後天|週[一二三四五六日天]|星期[一二三四五六日天]|\d{1,2}\/\d{1,2}|\d{1,2}月\d{1,2}日)/g);
  return matches ? [...new Set(matches)] : [];
}

function detectMoney(text) {
  const matches = text.match(/\d+\s*元/g);
  return matches ? [...new Set(matches.map((match) => match.replace(/\s+/g, "")))] : [];
}

function detectAction(text) {
  if (/請假|病假|事假/.test(text)) return "需要向老師說明請假原因與日期。";
  if (/繳|費用|付款|收費/.test(text)) return "需要留意繳費期限與金額。";
  if (/攜帶|帶|準備/.test(text)) return "需要協助孩子準備指定物品。";
  if (/回覆|確認|簽名|回條/.test(text)) return "需要回覆或完成家長確認。";
  return "建議回覆老師已收到，並確認會配合。";
}

function summarize(text) {
  const dates = detectDate(text);
  const items = detectItems(text);
  const money = detectMoney(text);
  const action = detectAction(text);
  const points = [];

  if (dates.length) points.push(`時間：${dates.join("、")}`);
  if (items.length) points.push(`物品：${items.join("、")}`);
  if (money.length) points.push(`金額：${money.join("、")}`);
  points.push(action);

  if (/謝謝|感謝/.test(text)) {
    points.push("回覆時可保留感謝語氣，讓訊息自然不生硬。");
  }

  return points;
}

function buildReminder(text) {
  const dates = detectDate(text);
  const items = detectItems(text);
  const money = detectMoney(text);
  const tasks = [];

  if (items.length) tasks.push(`準備 ${items.join("、")}`);
  if (money.length) tasks.push(`繳交 ${money.join("、")}`);
  if (/回條|簽名/.test(text)) tasks.push("檢查回條或家長簽名");

  if (!tasks.length) return "";
  return `${dates[0] || "近期"}：${tasks.join("；")}`;
}

function composeReply(text, tone) {
  const dates = detectDate(text);
  const items = detectItems(text);
  const money = detectMoney(text);
  const itemText = items.length ? `，我們會協助孩子準備${items.join("、")}` : "";
  const moneyText = money.length ? `，並留意繳交${money.join("、")}` : "";
  const dateText = dates.length ? `關於${dates.join("、")}的通知` : "通知";

  const replies = {
    polite: `老師您好，${dateText}已收到${itemText}${moneyText}，謝謝老師提醒。`,
    warm: `老師您好，謝謝您提醒我們${dateText}${itemText}${moneyText}。我們會在家協助孩子確認，辛苦老師了。`,
    formal: `老師您好，已確認收到${dateText}${itemText}${moneyText}。我們會依照通知內容配合，謝謝老師。`,
    question: `老師您好，${dateText}已收到${itemText}${moneyText}。想再跟老師確認一下，是否還有其他需要孩子一起準備的事項？謝謝老師。`
  };

  return replies[tone];
}

function renderSummary(points) {
  summaryList.innerHTML = "";
  points.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    summaryList.appendChild(item);
  });
}

function generate() {
  const text = messageInput.value.trim();

  if (!text) {
    showToast("請先貼上老師訊息");
    messageInput.focus();
    return;
  }

  renderSummary(summarize(text));
  replyDraft.textContent = composeReply(text, selectedTone);
  lastReminder = buildReminder(text);
  reminderText.textContent = lastReminder || "尚未偵測到需要提醒的事項。";
  replyStatus.textContent = "已整理";
}

document.querySelector("#loadSample").addEventListener("click", () => {
  messageInput.value = sampleMessage;
  generate();
});

document.querySelector("#generateReply").addEventListener("click", generate);

document.querySelectorAll(".tone-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tone-chip").forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");
    selectedTone = button.dataset.tone;
    if (messageInput.value.trim()) generate();
  });
});

document.querySelectorAll(".template-card").forEach((button) => {
  button.addEventListener("click", () => {
    replyDraft.textContent = templates[button.dataset.template];
    replyStatus.textContent = "已套用模板";
    showToast("已套用常用模板");
  });
});

document.querySelector("#copyReply").addEventListener("click", async () => {
  const text = replyDraft.textContent.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    showToast("回覆已複製");
  } catch {
    showToast("瀏覽器暫不支援自動複製");
  }
});

document.querySelector("#saveReminder").addEventListener("click", () => {
  showToast(lastReminder ? "已加入待辦提醒" : "目前沒有可加入的提醒");
});
