import { useEffect, useMemo, useState } from "react";

const DEFAULT_DEVELOPERS = ["Aisha", "Noah", "Mina", "Devon", "Ishaan"];
const STATUS_ORDER = ["Pending", "In Progress", "Done"];

const statusToClass = {
  Pending: "badge-pending",
  "In Progress": "badge-progress",
  Done: "badge-done"
};

const initialForm = {
  title: "",
  assignee: DEFAULT_DEVELOPERS[0],
  dueDate: "",
  description: "",
  status: "Pending"
};

function isOverdue(task) {
  if (task.status === "Done" || !task.dueDate) {
    return false;
  }

  const due = new Date(`${task.dueDate}T23:59:59`);
  return Date.now() > due.getTime();
}

function formatDate(dateInput) {
  if (!dateInput) {
    return "No due date";
  }

  const date = new Date(`${dateInput}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [developers, setDevelopers] = useState(DEFAULT_DEVELOPERS);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    role: "manager",
    name: DEFAULT_DEVELOPERS[0]
  });
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    async function hydrate() {
      const stored = await chrome.storage.local.get(["tasks", "developers", "currentUser"]);
      const nextDevelopers = Array.isArray(stored.developers) && stored.developers.length > 0
        ? stored.developers
        : DEFAULT_DEVELOPERS;

      const nextUser = stored.currentUser && stored.currentUser.role
        ? {
            role: stored.currentUser.role,
            name: stored.currentUser.name || nextDevelopers[0]
          }
        : { role: "manager", name: nextDevelopers[0] };

      setTasks(Array.isArray(stored.tasks) ? stored.tasks : []);
      setDevelopers(nextDevelopers);
      setCurrentUser(nextUser);
      setForm((prev) => ({ ...prev, assignee: nextDevelopers[0] }));
      setLoading(false);
    }

    hydrate();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!developers.includes(currentUser.name)) {
      const normalizedUser = { ...currentUser, name: developers[0] };
      setCurrentUser(normalizedUser);
      chrome.storage.local.set({ currentUser: normalizedUser });
    }
  }, [developers, currentUser, loading]);

  const visibleTasks = useMemo(() => {
    if (currentUser.role === "manager") {
      return tasks;
    }

    return tasks.filter((task) => task.assignee === currentUser.name);
  }, [tasks, currentUser]);

  const overdueCount = useMemo(
    () => tasks.filter((task) => isOverdue(task)).length,
    [tasks]
  );

  async function persistCurrentUser(nextUser) {
    setCurrentUser(nextUser);
    await chrome.storage.local.set({ currentUser: nextUser });
  }

  async function handleCreateTask(event) {
    event.preventDefault();

    const nextTask = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      assignee: form.assignee,
      dueDate: form.dueDate,
      description: form.description.trim(),
      status: form.status,
      createdAt: new Date().toISOString()
    };

    if (!nextTask.title || !nextTask.assignee || !nextTask.dueDate) {
      return;
    }

    const nextTasks = [nextTask, ...tasks];
    setTasks(nextTasks);
    await chrome.storage.local.set({ tasks: nextTasks });

    setForm((prev) => ({
      ...initialForm,
      assignee: developers[0],
      status: prev.status
    }));

    chrome.runtime.sendMessage({ type: "CHECK_OVERDUE" });
  }

  async function updateTaskStatus(taskId, nextStatus) {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const currentIndex = STATUS_ORDER.indexOf(currentTask.status);
    const nextIndex = STATUS_ORDER.indexOf(nextStatus);
    if (nextIndex < currentIndex) {
      return;
    }

    const nextTasks = tasks.map((task) => (
      task.id === taskId ? { ...task, status: nextStatus } : task
    ));

    setTasks(nextTasks);
    await chrome.storage.local.set({ tasks: nextTasks });
    chrome.runtime.sendMessage({ type: "CHECK_OVERDUE" });
  }

  if (loading) {
    return <main className="popup-shell"><section className="panel">Loading...</section></main>;
  }

  const isManager = currentUser.role === "manager";

  return (
    <main className="popup-shell">
      <header className="topbar">
        <div className="title-wrap">
          <div className="logo" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img" focusable="false">
              <path d="M33 4l5 7 8-1 1 8 8 3-3 7 5 6-5 6 3 7-8 3-1 8-8-1-5 7-6-5-7 5-5-7-8 1-1-8-8-3 3-7-5-6 5-6-3-7 8-3 1-8 8 1 5-7 7 5 6-5zm-1 17a11 11 0 100 22 11 11 0 000-22zm0 6a5 5 0 110 10 5 5 0 010-10z" />
            </svg>
          </div>
          <div>
            <h1>Developer Task Manager</h1>
            <p>Track work with clarity and speed</p>
          </div>
        </div>

        <div className="viewer-controls">
          <label htmlFor="roleSelect">View as</label>
          <select
            id="roleSelect"
            className="input"
            value={currentUser.role}
            onChange={(event) => {
              persistCurrentUser({ ...currentUser, role: event.target.value });
            }}
          >
            <option value="manager">Manager</option>
            <option value="developer">Developer</option>
          </select>
          <select
            className={`input ${isManager ? "hidden" : ""}`}
            aria-label="Select developer"
            value={currentUser.name}
            onChange={(event) => {
              persistCurrentUser({ ...currentUser, name: event.target.value });
            }}
          >
            {developers.map((dev) => (
              <option key={dev} value={dev}>{dev}</option>
            ))}
          </select>
        </div>
      </header>

      <section className={`panel ${isManager ? "" : "hidden"}`}>
        <h2>Create New Task</h2>
        <form className="task-form" onSubmit={handleCreateTask}>
          <div className="field">
            <label htmlFor="taskTitle">Task Title</label>
            <input
              id="taskTitle"
              className="input"
              type="text"
              placeholder="API rate-limit middleware"
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="taskAssignee">Assign Developer</label>
              <select
                id="taskAssignee"
                className="input"
                required
                value={form.assignee}
                onChange={(event) => setForm({ ...form, assignee: event.target.value })}
              >
                {developers.map((dev) => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="taskDueDate">Due Date</label>
              <input
                id="taskDueDate"
                className="input"
                type="date"
                required
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="taskDescription">Description</label>
            <textarea
              id="taskDescription"
              className="input textarea"
              rows="3"
              placeholder="Describe scope, acceptance criteria, and blockers."
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="taskStatus">Task Status</label>
            <select
              id="taskStatus"
              className="input"
              required
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <button className="create-btn" type="submit">Create Task</button>
        </form>
      </section>

      <section className="panel">
        <div className="task-head">
          <h2>{isManager ? "Task List (All Tasks)" : `Task List (${currentUser.name})`}</h2>
          {isManager && overdueCount > 0 ? (
            <span className="overdue-pill">{overdueCount} overdue</span>
          ) : null}
        </div>

        <div className="task-list">
          {visibleTasks.length === 0 ? (
            <div className="empty-state">
              {isManager ? "No tasks yet. Create your first task above." : "No assigned tasks yet."}
            </div>
          ) : (
            visibleTasks.map((task) => {
              const currentIndex = STATUS_ORDER.indexOf(task.status);
              const canEdit = currentUser.role === "developer" && task.assignee === currentUser.name;

              return (
                <article className="task-card" key={task.id}>
                  <div className="task-card-head">
                    <h3 className="task-title">{task.title}</h3>
                    <span className={`status-badge ${statusToClass[task.status] || "badge-pending"}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="task-meta">Assigned: {task.assignee}</p>
                  <p className="task-meta">Due: {formatDate(task.dueDate)}</p>
                  <p className="task-desc">{task.description || "No description provided."}</p>

                  <div className="task-actions">
                    <label>Status</label>
                    <select
                      className="input"
                      value={task.status}
                      disabled={!canEdit}
                      title={!canEdit ? "Only the assigned developer can update status." : ""}
                      onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                    >
                      {STATUS_ORDER.map((status) => (
                        <option
                          key={status}
                          value={status}
                          disabled={STATUS_ORDER.indexOf(status) < currentIndex}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
