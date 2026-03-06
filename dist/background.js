const OVERDUE_ALARM_NAME = "overdue-task-check";

chrome.runtime.onInstalled.addListener(async () => {
  await ensureAlarm();
  await checkAndNotifyOverdueTasks();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureAlarm();
  await checkAndNotifyOverdueTasks();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== OVERDUE_ALARM_NAME) {
    return;
  }

  await checkAndNotifyOverdueTasks();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "CHECK_OVERDUE") {
    checkAndNotifyOverdueTasks();
  }
});

async function ensureAlarm() {
  const alarm = await chrome.alarms.get(OVERDUE_ALARM_NAME);
  if (!alarm) {
    chrome.alarms.create(OVERDUE_ALARM_NAME, {
      periodInMinutes: 15
    });
  }
}

async function checkAndNotifyOverdueTasks() {
  const { tasks = [], overdueNotified = {} } = await chrome.storage.local.get([
    "tasks",
    "overdueNotified"
  ]);

  let hasUpdates = false;

  for (const task of tasks) {
    const isDone = task.status === "Done";
    const isOverdue = isTaskOverdue(task);
    const noticeKey = `${task.id}:${task.dueDate}`;

    if (isDone || !isOverdue) {
      if (overdueNotified[noticeKey]) {
        delete overdueNotified[noticeKey];
        hasUpdates = true;
      }
      continue;
    }

    if (overdueNotified[noticeKey]) {
      continue;
    }

    await chrome.notifications.create(`overdue-${task.id}`, {
      type: "basic",
      iconUrl: "icons/alert-128.png",
      title: "Overdue Developer Task",
      message: `${task.title} assigned to ${task.assignee} is overdue.`
    });

    overdueNotified[noticeKey] = true;
    hasUpdates = true;
  }

  if (hasUpdates) {
    await chrome.storage.local.set({ overdueNotified });
  }
}

function isTaskOverdue(task) {
  if (!task?.dueDate) {
    return false;
  }

  const due = new Date(`${task.dueDate}T23:59:59`);
  return Date.now() > due.getTime();
}
