const messageInput = document.querySelector("#teacherMessage");
const summaryList = document.querySelector("#summaryList");
const replyDraft = document.querySelector("#replyDraft");
const replyStatus = document.querySelector("#replyStatus");
const reminderText = document.querySelector("#reminderText");
const toast = document.querySelector("#toast");
const emotionLevel = document.querySelector("#emotionLevel");
const teacherEmotion = document.querySelector("#teacherEmotion");
const replyStrategy = document.querySelector("#replyStrategy");

const sampleMessage =
  "媽媽您好，聯絡簿已經提醒好幾次了，孩子今天還是沒有帶透明塑膠杯。明天自然課真的會用到，麻煩這次務必協助準備，謝謝。";

const templates = {
  sick: "老師您好，孩子今天身體不舒服，需要請病假一天，麻煩老師協助留意課堂進度，謝謝老師。",
  absence: "老師您好，孩子因家中有事需要請事假，若有當天作業或注意事項，再麻煩老師告知，謝謝。",
  forgot: "老師您好，孩子今天忘記攜帶指定物品，我們會提醒孩子明天補帶，也謝謝老師協助。",
  thanks: "老師您好，謝謝您今天的提醒與照顧，我們會在家協助孩子配合。",
  payment: "老師您好，費用通知已收到，我們會在期限前協助孩子繳交，謝謝老師提醒。"
};

let selectedTone = "polite";
let selectedMood = "steady";
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

function analyzeTeacherEmotion(text) {
  const repeated = /(再一次|再次|已經|好幾次|多次|前面提醒|之前提醒|仍然|還是|又|務必|一定要)/;
  const impatient = /(真的|請務必|麻煩.*務必|希望.*配合|不要再|還是沒有|仍未|一直|每次|困擾|影響到)/;
  const sarcasm = /(可能忘了|應該不難|不知道是不是|也許.*比較|如果方便的話.*務必|看起來.*沒有|又忘了|終於)/;
  const urgent = /(今天|明天|立刻|馬上|期限|最後|截止|務必)/;

  const signals = [];
  if (repeated.test(text)) signals.push("多次提醒");
  if (impatient.test(text)) signals.push("可能不耐煩");
  if (sarcasm.test(text)) signals.push("可能反諷或委婉施壓");
  if (urgent.test(text)) signals.push("有時間壓力");

  let level = "一般提醒";
  let emotion = "老師語氣看起來偏一般通知或提醒。";
  let strategy = "回覆可以簡短確認，補上會配合的具體行動。";
  let severity = "normal";

  if (signals.length >= 2 || sarcasm.test(text)) {
    level = "高敏感";
    severity = "warning";
    emotion = `老師可能已經有情緒：${signals.join("、")}。不要只回「收到」，建議先承接老師的辛苦或不便。`;
    strategy = "先道歉或承認疏漏，再說明今天會怎麼補救，最後給老師一個明確承諾。";
  } else if (signals.length === 1) {
    level = "需留意";
    severity = "warning";
    emotion = `老師訊息中出現「${signals[0]}」訊號，可能不是單純提醒。`;
    strategy = "回覆時加上一句理解老師提醒的原因，避免語氣太輕描淡寫。";
  }

  return { level, emotion, strategy, severity, signals };
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

  const emotion = analyzeTeacherEmotion(text);
  if (emotion.signals.length) {
    points.push(`情緒要件：${emotion.signals.join("、")}。`);
  }

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
  const emotion = analyzeTeacherEmotion(text);
  const isSensitive = emotion.severity === "warning";

  const moodOpeners = {
    steady: isSensitive ? "老師您好，謝謝您再次提醒，也抱歉讓老師多費心了。" : "老師您好，通知已收到。",
    sorry: "老師您好，真的不好意思，這件事讓老師多提醒了。",
    anxious: "老師您好，謝謝老師提醒，我們會馬上協助孩子確認。",
    boundary: "老師您好，謝謝老師提醒，我們會配合處理；也想先跟老師確認實際需要完成的事項。"
  };

  const sensitiveAction = `${itemText || "，我們會和孩子確認需要準備的事項"}${moneyText}，今天會再檢查一次，避免明天又漏掉。`;
  const normalAction = `${itemText}${moneyText}`;

  const replies = {
    polite: isSensitive
      ? `${moodOpeners[selectedMood]}${dateText}我們已確認${sensitiveAction}謝謝老師。`
      : `老師您好，${dateText}已收到${normalAction}，謝謝老師提醒。`,
    warm: isSensitive
      ? `${moodOpeners[selectedMood]}我們理解老師一直提醒也很辛苦，${dateText}我們會在家協助孩子確實完成${sensitiveAction}謝謝老師。`
      : `老師您好，謝謝您提醒我們${dateText}${normalAction}。我們會在家協助孩子確認，辛苦老師了。`,
    formal: isSensitive
      ? `${moodOpeners[selectedMood]}已確認${dateText}${sensitiveAction}後續我們會更留意聯絡簿與老師通知。`
      : `老師您好，已確認收到${dateText}${normalAction}。我們會依照通知內容配合，謝謝老師。`,
    question: isSensitive
      ? `${moodOpeners[selectedMood]}${dateText}我們會先補上${sensitiveAction}也想跟老師確認，除了這項之外，是否還有其他需要孩子一起完成的事項？謝謝老師。`
      : `老師您好，${dateText}已收到${normalAction}。想再跟老師確認一下，是否還有其他需要孩子一起準備的事項？謝謝老師。`
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

  const emotion = analyzeTeacherEmotion(text);
  emotionLevel.textContent = emotion.level;
  emotionLevel.classList.toggle("warning", emotion.severity === "warning");
  teacherEmotion.textContent = emotion.emotion;
  replyStrategy.textContent = emotion.strategy;
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

document.querySelectorAll(".mood-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mood-chip").forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");
    selectedMood = button.dataset.mood;
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
