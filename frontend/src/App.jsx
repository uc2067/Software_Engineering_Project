import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

const API_BASE = "http://127.0.0.1:8000";

const emptyProfile = (userId = 1) => ({
  user_id: userId,
  full_name: "",
  email: "",
  role_title: "",
  department: "",
  bio: "",
  skills: "",
  interests: "",
  experience_level: "",
  github_url: "",
  linkedin_url: "",
  current_workload: 0,
  capacity: 5,
  availability_status: "",
});

function AppContent() {
  // Auth
  const { user, logout, token } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(1);
  const [profileForm, setProfileForm] = useState(emptyProfile(1));

  // Role-based UI
  const [currentRole, setCurrentRole] = useState("Admin");

  // Admin create user
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Developer",
  });

  // Scrum Master create task
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    required_skills: "",
    assignee_id: "",
    status: "To Do",
  });

  // Loading states
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingProfileForm, setLoadingProfileForm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Toast
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const getAuthHeaders = () => {
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await axios.get(`${API_BASE}/dashboard`, {
        headers: getAuthHeaders(),
      });
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load dashboard");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await axios.get(`${API_BASE}/tasks`, {
        headers: getAuthHeaders(),
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`, {
        headers: getAuthHeaders(),
      });
      setUsers(res.data);
      if (res.data.length > 0 && !selectedUserId) {
        setSelectedUserId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load users");
    }
  };

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const res = await axios.get(`${API_BASE}/profiles`, {
        headers: getAuthHeaders(),
      });
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load profiles");
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadProfile = async (userId) => {
    setLoadingProfileForm(true);
    try {
      const res = await axios.get(`${API_BASE}/profile/${userId}`, {
        headers: getAuthHeaders(),
      });
      setProfileForm(res.data);
    } catch (err) {
      setProfileForm(emptyProfile(userId));
    } finally {
      setLoadingProfileForm(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      const init = async () => {
        await Promise.all([
          fetchDashboard(),
          fetchTasks(),
          fetchUsers(),
          fetchProfiles(),
        ]);
        await loadProfile(1);
      };
      init();
    }
  }, [user, token]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]:
        name === "user_id" ||
        name === "current_workload" ||
        name === "capacity"
          ? Number(value)
          : value,
    }));
  };

  const handleUserChange = async (e) => {
    const userId = Number(e.target.value);
    setSelectedUserId(userId);
    await loadProfile(userId);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = { ...profileForm, user_id: selectedUserId };
      const res = await axios.post(`${API_BASE}/profile`, payload, {
        headers: getAuthHeaders(),
      });
      setProfileForm(res.data);
      await Promise.all([fetchProfiles(), fetchDashboard()]);
      showToast("Profile saved successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name.trim()) {
      showToast("Please enter a user name");
      return;
    }
    if (!newUser.email.trim()) {
      showToast("Please enter an email");
      return;
    }
    if (!newUser.password.trim()) {
      showToast("Please enter a password");
      return;
    }

    try {
      await axios.post(`${API_BASE}/users`, newUser, {
        headers: getAuthHeaders(),
      });
      setNewUser({ name: "", email: "", password: "", role: "Developer" });
      await fetchUsers();
      showToast("User created successfully");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Error creating user");
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      showToast("Please enter a task title");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/tasks`,
        {
          ...newTask,
          assignee_id: newTask.assignee_id ? Number(newTask.assignee_id) : null,
        },
        { headers: getAuthHeaders() }
      );
      setNewTask({
        title: "",
        description: "",
        required_skills: "",
        assignee_id: "",
        status: "To Do",
      });
      await Promise.all([fetchTasks(), fetchDashboard()]);
      showToast("Task created successfully");
    } catch (err) {
      console.error(err);
      showToast("Error creating task");
    }
  };

  const taskStats = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "To Do").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      done: tasks.filter((t) => t.status === "Done").length,
    };
  }, [tasks]);

  if (!user) {
    return showRegister ? (
      <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo-wrap">
          <div className="logo-badge">IT</div>
          <div>
            <h1>IntelliTrack</h1>
            <p>Sprint 04 Workspace</p>
          </div>
        </div>

        <div className="user-info">
          <p className="user-name">{user.name}</p>
          <p className="user-role">{user.role}</p>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="side-section">
          <a href="#overview" className="nav-link">Overview</a>
          {user.role === "Admin" && (
            <a href="#admin" className="nav-link">Admin</a>
          )}
          {user.role === "Scrum Master" && (
            <a href="#scrum" className="nav-link">Scrum</a>
          )}
          <a href="#profiles" className="nav-link">Profiles</a>
          <a href="#directory" className="nav-link">Team Directory</a>
          <a href="#tasks" className="nav-link">Tasks</a>
          
          <div className="sidebar-actions" style={{marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "grid", gap: "8px"}}>
            <button className="secondary-btn" onClick={fetchDashboard} style={{fontSize: "0.9rem", padding: "8px 12px"}}>Refresh Dashboard</button>
            <button className="secondary-btn" onClick={fetchTasks} style={{fontSize: "0.9rem", padding: "8px 12px"}}>Refresh Tasks</button>
          </div>
        </div>

        <div className="side-mini-card">
          <p className="mini-label">Environment</p>
          <h3>Local Demo</h3>
          <span>FastAPI + React + SQLite</span>
        </div>
      </aside>

      <main className="main-area">
        {toast && <div className="toast">{toast}</div>}

        <section id="overview" className="hero-panel">
          <div>
            <p className="eyebrow">Agile Intelligence Platform</p>
            <h2>Modern sprint monitoring and role-based workflow management</h2>
            <p className="hero-copy">
              IntelliTrack provides a realistic internal product experience for
              project administration, sprint task coordination, and structured
              developer profile management through a connected frontend and backend.
            </p>
          </div>

          <div className="hero-actions">
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", margin: "0" }}>Role: <strong>{user.role}</strong></p>
          </div>
        </section>

        <section className="content-section">
          <div className="section-head">
            <h3>Sprint Dashboard</h3>
            <span className="tag">Live Data</span>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>To Do</span>
              <h4>{loadingDashboard ? "..." : dashboard?.todo ?? 0}</h4>
            </div>
            <div className="stat-card">
              <span>In Progress</span>
              <h4>{loadingDashboard ? "..." : dashboard?.in_progress ?? 0}</h4>
            </div>
            <div className="stat-card">
              <span>Done</span>
              <h4>{loadingDashboard ? "..." : dashboard?.done ?? 0}</h4>
            </div>
            <div className="stat-card featured">
              <span>Completion</span>
              <h4>
                {loadingDashboard ? "..." : `${dashboard?.completion_percentage ?? 0}%`}
              </h4>
            </div>
          </div>

          <div className="two-col">
            <div className="panel">
              <div className="section-head small">
                <h3>Developer Workload</h3>
              </div>
              <div className="list-stack">
                {dashboard?.workload &&
                  Object.entries(dashboard.workload).map(([name, count]) => (
                    <div className="list-row" key={name}>
                      <span>{name}</span>
                      <strong>{count} task(s)</strong>
                    </div>
                  ))}
              </div>
            </div>

            <div className="panel">
              <div className="section-head small">
                <h3>Task Summary</h3>
              </div>
              <div className="summary-stack">
                <div className="summary-item">
                  <span>Total Tasks</span>
                  <strong>{tasks.length}</strong>
                </div>
                <div className="summary-item">
                  <span>To Do</span>
                  <strong>{taskStats.todo}</strong>
                </div>
                <div className="summary-item">
                  <span>In Progress</span>
                  <strong>{taskStats.inProgress}</strong>
                </div>
                <div className="summary-item">
                  <span>Done</span>
                  <strong>{taskStats.done}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {user.role === "Admin" && (
          <section id="admin" className="content-section">
            <div className="section-head">
              <h3>Admin Panel</h3>
              <span className="tag">User Onboarding</span>
            </div>

            <div className="panel">
              <div className="profile-grid">
                <div className="field-group">
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="field-group">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, role: e.target.value }))
                    }
                  >
                    <option>Developer</option>
                    <option>Scrum Master</option>
                    <option>Admin</option>
                  </select>
                </div>

                <div className="full">
                  <button className="primary-btn" type="button" onClick={handleCreateUser}>
                    Add User
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {user.role === "Scrum Master" && (
          <section id="scrum" className="content-section">
            <div className="section-head">
              <h3>Scrum Master Panel</h3>
              <span className="tag">Task Creation</span>
            </div>

            <div className="panel">
              <div className="profile-grid">
                <div className="field-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div className="field-group">
                  <label>Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                </div>

                <div className="field-group full">
                  <label>Description</label>
                  <textarea
                    rows="4"
                    placeholder="Enter task description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="field-group">
                  <label>Required Skills</label>
                  <input
                    type="text"
                    placeholder="Python, React, SQL"
                    value={newTask.required_skills}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        required_skills: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="field-group">
                  <label>Assign To</label>
                  <select
                    value={newTask.assignee_id}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        assignee_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {users
                      .filter((u) => u.role === "Developer")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="full">
                  <button className="primary-btn" type="button" onClick={handleCreateTask}>
                    Create Task
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="profiles" className="content-section">
          <div className="section-head">
            <h3>Developer Profile Management</h3>
            <span className="tag">Integrated Form</span>
          </div>

          <div className="panel">
            <div className="toolbar">
              <div className="field-group short">
                <label>Select Team Member</label>
                <select value={selectedUserId} onChange={handleUserChange}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="secondary-btn"
                type="button"
                onClick={() => loadProfile(selectedUserId)}
              >
                Reload Profile
              </button>
            </div>

            {loadingProfileForm ? (
              <p className="loading-text">Loading profile...</p>
            ) : (
              <form className="profile-grid" onSubmit={handleProfileSubmit}>
                <div className="field-group">
                  <label>Full Name</label>
                  <input
                    name="full_name"
                    value={profileForm.full_name}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Email</label>
                  <input
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Role Title</label>
                  <input
                    name="role_title"
                    value={profileForm.role_title}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Department</label>
                  <input
                    name="department"
                    value={profileForm.department}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group full">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    rows="4"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Skills</label>
                  <input
                    name="skills"
                    placeholder="Python, React, SQL"
                    value={profileForm.skills}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Interests</label>
                  <input
                    name="interests"
                    placeholder="AI, Backend, UX"
                    value={profileForm.interests}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Experience Level</label>
                  <input
                    name="experience_level"
                    value={profileForm.experience_level}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Availability Status</label>
                  <input
                    name="availability_status"
                    placeholder="Available / Busy"
                    value={profileForm.availability_status}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Current Workload</label>
                  <input
                    name="current_workload"
                    type="number"
                    value={profileForm.current_workload}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>Capacity</label>
                  <input
                    name="capacity"
                    type="number"
                    value={profileForm.capacity}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>GitHub URL</label>
                  <input
                    name="github_url"
                    value={profileForm.github_url}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="field-group">
                  <label>LinkedIn URL</label>
                  <input
                    name="linkedin_url"
                    value={profileForm.linkedin_url}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="full">
                  <button className="primary-btn" type="submit" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section id="directory" className="content-section">
          <div className="section-head">
            <h3>Team Directory</h3>
            <span className="tag">Synced Profiles</span>
          </div>

          {loadingProfiles ? (
            <p className="loading-text">Loading profiles...</p>
          ) : (
            <div className="card-grid">
              {profiles.map((profile) => (
                <div className="member-card" key={profile.id}>
                  <div className="avatar">
                    {(profile.full_name || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <h4>{profile.full_name || "Unnamed User"}</h4>
                  <p className="muted">{profile.role_title || "Developer"}</p>
                  <p className="muted">{profile.department || "Engineering"}</p>

                  <div className="chip-row">
                    <span className="chip">{profile.experience_level || "N/A"}</span>
                    <span className="chip">
                      {profile.availability_status || "Unknown"}
                    </span>
                  </div>

                  <p><strong>Email:</strong> {profile.email || "Not added"}</p>
                  <p><strong>Skills:</strong> {profile.skills || "Not added"}</p>
                  <p><strong>Interests:</strong> {profile.interests || "Not added"}</p>
                  <p><strong>Workload:</strong> {profile.current_workload} / {profile.capacity}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="tasks" className="content-section">
          <div className="section-head">
            <h3>Sprint Tasks</h3>
            <span className="tag">Live Task Board</span>
          </div>

          {loadingTasks ? (
            <p className="loading-text">Loading tasks...</p>
          ) : (
            <div className="card-grid">
              {tasks.map((task) => (
                <div className="task-card" key={task.id}>
                  <div className="task-header">
                    <h4>{task.title}</h4>
                    <span className="status-pill">{task.status}</span>
                  </div>
                  <p>{task.description}</p>
                  <p><strong>Required Skills:</strong> {task.required_skills || "N/A"}</p>
                  <p><strong>Assignee ID:</strong> {task.assignee_id ?? "Unassigned"}</p>
                  <p><strong>Sprint ID:</strong> {task.sprint_id ?? "N/A"}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}