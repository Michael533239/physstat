import { createContext, useContext } from "react";

const DataContext = createContext();
const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const api = {
  getHeaders: (isFormData = false) => {
    const token = localStorage.getItem("token");
    const h = {};
    if (!isFormData) h["Content-Type"] = "application/json";
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  },
  handle: async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка запроса");
    return data;
  },
  get: (p) =>
    fetch(`${API}${p}`, { headers: api.getHeaders() }).then(api.handle),
  post: (p, b) =>
    fetch(`${API}${p}`, {
      method: "POST",
      headers: api.getHeaders(),
      body: JSON.stringify(b),
    }).then(api.handle),
  patch: (p, b) =>
    fetch(`${API}${p}`, {
      method: "PATCH",
      headers: api.getHeaders(),
      body: JSON.stringify(b),
    }).then(api.handle),
  delete: (p) =>
    fetch(`${API}${p}`, { method: "DELETE", headers: api.getHeaders() }).then(
      api.handle,
    ),
  postForm: (p, f) =>
    fetch(`${API}${p}`, {
      method: "POST",
      headers: api.getHeaders(true),
      body: f,
    }).then(api.handle),
  patchForm: (p, f) =>
    fetch(`${API}${p}`, {
      method: "PATCH",
      headers: api.getHeaders(true),
      body: f,
    }).then(api.handle),
};

export const imageUrl = (f) => `${API}/uploads/${f}`;

export function DataProvider({ children }) {
  const saveAuth = (data) => {
    if (data.token) localStorage.setItem("token", data.token);
    return data.id;
  };

  const value = {
    verifyMe: () => api.get("/auth/me"),
    logout: () => {
      localStorage.removeItem("token");
      sessionStorage.clear();
    },

    checkTeacher: (b) => api.post("/auth/teacher", b).then(saveAuth),
    checkStudent: (b) => api.post("/auth/student", b).then(saveAuth),
    addTeacher: (b) => api.post("/teachers", b).then(saveAuth),
    addStudent: (b) => api.post("/students", b).then(saveAuth),

    getTeacher: (id) => api.get(`/teachers/${id}`),
    getStudent: (id) => api.get(`/students/${id}`),
    getGroup: (id) => api.get(`/groups/${id}`),
    addGroup: (b) => api.post("/groups", b),
    editGroup: (id, b) => api.patch(`/groups/${id}`, b),
    deleteGroup: (id) => api.delete(`/groups/${id}`),

    getContest: (id) => api.get(`/contests/${id}`),
    addContest: (b) => api.post("/contests", b),
    editContest: (id, b) => api.patch(`/contests/${id}`, b),
    deleteContest: (id) => api.delete(`/contests/${id}`),

    getTask: (id) => api.get(`/tasks/${id}`),
    addTask: (d) => {
      const f = new FormData();
      Object.keys(d).forEach((k) => d[k] !== null && f.append(k, d[k]));
      return api.postForm("/tasks", f);
    },
    editTask: (id, d) => {
      const f = new FormData();
      Object.keys(d).forEach((k) => d[k] !== null && f.append(k, d[k]));
      return api.patchForm(`/tasks/${id}`, f);
    },
    deleteTask: (id) => api.delete(`/tasks/${id}`),

    addAttempt: (b) => api.post("/attempts", b),
    getAttempts: (s, t) => api.get(`/attempts?studentId=${s}&taskId=${t}`),

    statisticTask: (studentId, taskId) =>
      api
        .get(`/statistic/task?studentId=${studentId}&taskId=${taskId}`)
        .then((r) => r.result),
    statisticContest: (studentId, contestId) =>
      api.get(
        `/statistic/contest?studentId=${studentId}&contestId=${contestId}`,
      ),
    statisticGroup: (studentId, groupId) =>
      api.get(`/statistic/group?studentId=${studentId}&groupId=${groupId}`),
    statisticGroupTable: (groupId) =>
      api.get(`/statistic/group-table?groupId=${groupId}`),

    linkTeacherGroup: (teacherId, groupId) =>
      api.post("/link/teacher", { teacherId, groupId }),
    unlinkTeacherGroup: (teacherId, groupId) =>
      api.post("/unlink/teacher", { teacherId, groupId }),
    linkStudentGroup: (studentId, groupId) =>
      api.post("/link/student", { studentId, groupId }),
    unlinkStudentGroup: (studentId, groupId) =>
      api.post("/unlink/student", { studentId, groupId }),
    linkTeacherGroupByLogin: (login, groupId) =>
      api.post("/link/teacher", { login, groupId }),
    linkStudentGroupByLogin: (login, groupId) =>
      api.post("/link/student", { login, groupId }),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
