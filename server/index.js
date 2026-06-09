const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const knex = require("knex");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "physics_platform_secret_2026";

const db = knex({
  client: "sqlite3",
  connection: { filename: process.env.DB_PATH || "data.sqlite" },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      conn.run("PRAGMA busy_timeout = 5000;", (err) => {
        if (err) return cb(err, conn);
        conn.run("PRAGMA journal_mode = WAL;", (err2) => cb(err2, conn));
      });
    },
  },
});

async function initDb() {
  if (!(await db.schema.hasTable("teachers"))) {
    await db.schema.createTable("teachers", (t) => {
      t.string("id").primary();
      t.string("name");
      t.string("login").unique();
      t.string("password");
    });
  }
  if (!(await db.schema.hasTable("students"))) {
    await db.schema.createTable("students", (t) => {
      t.string("id").primary();
      t.string("name");
      t.string("login").unique();
      t.string("password");
    });
  }
  if (!(await db.schema.hasTable("groups"))) {
    await db.schema.createTable("groups", (t) => {
      t.string("id").primary();
      t.string("name");
    });
  }
  if (!(await db.schema.hasTable("contests"))) {
    await db.schema.createTable("contests", (t) => {
      t.string("id").primary();
      t.string("name");
      t.string("groupId").references("groups.id").onDelete("CASCADE");
    });
  }
  if (!(await db.schema.hasTable("tasks"))) {
    await db.schema.createTable("tasks", (t) => {
      t.string("id").primary();
      t.string("contestId").references("contests.id").onDelete("CASCADE");
      t.string("name");
      t.text("text");
      t.string("image");
      t.string("type");
      t.float("number");
      t.float("error");
      t.float("weight");
    });
  }
  if (!(await db.schema.hasTable("attempts"))) {
    await db.schema.createTable("attempts", (t) => {
      t.string("id").primary();
      t.string("studentId").references("students.id").onDelete("CASCADE");
      t.string("taskId").references("tasks.id").onDelete("CASCADE");
      t.float("number");
      t.boolean("result");
    });
  }
  if (!(await db.schema.hasTable("teacher_groups"))) {
    await db.schema.createTable("teacher_groups", (t) => {
      t.string("teacherId").references("teachers.id").onDelete("CASCADE");
      t.string("groupId").references("groups.id").onDelete("CASCADE");
      t.primary(["teacherId", "groupId"]);
    });
  }
  if (!(await db.schema.hasTable("student_groups"))) {
    await db.schema.createTable("student_groups", (t) => {
      t.string("studentId").references("students.id").onDelete("CASCADE");
      t.string("groupId").references("groups.id").onDelete("CASCADE");
      t.primary(["studentId", "groupId"]);
    });
  }
}
initDb();

const app = express();
app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Авторизуйтесь" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Сессия истекла" });
    req.user = user;
    next();
  });
}

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() +
        "_" +
        Math.random().toString(36).slice(2) +
        path.extname(file.originalname),
    ),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const newId = (prefix) =>
  `${prefix}_${Date.now()}${Math.floor(Math.random() * 1000)}`;
const deleteFile = (f) => f && fs.unlink(path.join(uploadsDir, f), () => {});

app.post("/auth/:role", async (req, res) => {
  const { login, password } = req.body;
  const table = req.params.role === "teacher" ? "teachers" : "students";
  const user = await db(table).where({ login: login.trim(), password }).first();
  if (!user)
    return res.status(401).json({ error: "Неверный логин или пароль" });
  const token = jwt.sign({ id: user.id, role: req.params.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ id: user.id, token, role: req.params.role });
});

app.get("/auth/me", authenticateToken, (req, res) =>
  res.json({ id: req.user.id, role: req.user.role }),
);

app.get("/teachers/:id", authenticateToken, async (req, res) => {
  const user = await db("teachers").where({ id: req.params.id }).first();
  const groups = await db("teacher_groups")
    .where({ teacherId: user.id })
    .pluck("groupId");
  res.json({ ...user, groupIds: groups, password: "" });
});

app.post("/teachers", async (req, res) => {
  const { name, login, password } = req.body;
  const id = newId("teacher");
  await db("teachers").insert({
    id,
    name: name.trim(),
    login: login.trim(),
    password,
  });
  const token = jwt.sign({ id, role: "teacher" }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ id, token, role: "teacher" });
});

app.get("/students/:id", authenticateToken, async (req, res) => {
  const user = await db("students").where({ id: req.params.id }).first();
  const groups = await db("student_groups")
    .where({ studentId: user.id })
    .pluck("groupId");
  res.json({ ...user, groupIds: groups, password: "" });
});

app.post("/students", async (req, res) => {
  const { name, login, password } = req.body;
  const id = newId("student");
  await db("students").insert({
    id,
    name: name.trim(),
    login: login.trim(),
    password,
  });
  const token = jwt.sign({ id, role: "student" }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ id, token, role: "student" });
});

app.get("/groups/:id", authenticateToken, async (req, res) => {
  const group = await db("groups").where({ id: req.params.id }).first();
  const teacherIds = await db("teacher_groups")
    .where({ groupId: group.id })
    .pluck("teacherId");
  const studentIds = await db("student_groups")
    .where({ groupId: group.id })
    .pluck("studentId");
  const contestIds = await db("contests")
    .where({ groupId: group.id })
    .pluck("id");
  res.json({ ...group, teacherIds, studentIds, contestIds });
});

app.post("/groups", authenticateToken, async (req, res) => {
  const group = { id: newId("group"), name: req.body.name.trim() };
  await db("groups").insert(group);
  res.json(group);
});

app.patch("/groups/:id", authenticateToken, async (req, res) => {
  await db("groups")
    .where({ id: req.params.id })
    .update({ name: req.body.name.trim() });
  res.json({ ok: true });
});

app.delete("/groups/:id", authenticateToken, async (req, res) => {
  const tasks = await db("tasks")
    .join("contests", "tasks.contestId", "=", "contests.id")
    .where("contests.groupId", req.params.id)
    .select("tasks.image");
  tasks.forEach((t) => deleteFile(t.image));
  await db("groups").where({ id: req.params.id }).del();
  res.json({ ok: true });
});

app.get("/contests/:id", authenticateToken, async (req, res) => {
  const contest = await db("contests").where({ id: req.params.id }).first();
  const taskIds = await db("tasks")
    .where({ contestId: contest.id })
    .pluck("id");
  res.json({ ...contest, taskIds });
});

app.post("/contests", authenticateToken, async (req, res) => {
  const contest = {
    id: newId("contest"),
    groupId: req.body.groupId,
    name: req.body.name.trim(),
  };
  await db("contests").insert(contest);
  res.json(contest);
});

app.patch("/contests/:id", authenticateToken, async (req, res) => {
  await db("contests")
    .where({ id: req.params.id })
    .update({ name: req.body.name.trim() });
  res.json({ ok: true });
});

app.delete("/contests/:id", authenticateToken, async (req, res) => {
  const tasks = await db("tasks")
    .where({ contestId: req.params.id })
    .select("image");
  tasks.forEach((t) => deleteFile(t.image));
  await db("contests").where({ id: req.params.id }).del();
  res.json({ ok: true });
});

app.get("/tasks/:id", authenticateToken, async (req, res) =>
  res.json(await db("tasks").where({ id: req.params.id }).first()),
);

app.post(
  "/tasks",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { contestId, name, text, type, number, error, weight } = req.body;
    const task = {
      id: newId("task"),
      contestId,
      name: name.trim(),
      text: text || "",
      image: req.file ? req.file.filename : null,
      type,
      number: Number(number),
      error: Number(error || 0),
      weight: Number(weight || 1),
    };
    await db("tasks").insert(task);
    res.json(task);
  },
);

app.patch(
  "/tasks/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const task = await db("tasks").where({ id: req.params.id }).first();
    const { name, text, type, number, error, weight, removeImage } = req.body;
    const update = {
      name: name.trim(),
      text: text || "",
      type,
      number: Number(number),
      error: Number(error || 0),
      weight: Number(weight || 1),
    };
    if (req.file) {
      deleteFile(task.image);
      update.image = req.file.filename;
    } else if (removeImage === "true") {
      deleteFile(task.image);
      update.image = null;
    }
    await db("tasks").where({ id: req.params.id }).update(update);
    res.json({ ok: true });
  },
);

app.delete("/tasks/:id", authenticateToken, async (req, res) => {
  const task = await db("tasks").where({ id: req.params.id }).first();
  deleteFile(task.image);
  await db("tasks").where({ id: req.params.id }).del();
  res.json({ ok: true });
});

app.post("/attempts", authenticateToken, async (req, res) => {
  const { studentId, taskId, number } = req.body;
  const task = await db("tasks").where({ id: taskId }).first();
  const val = Number(number);
  let resOk = false;
  if (task.type === "number") resOk = task.number === val;
  else if (task.type === "number_absolute")
    resOk = Math.abs(val - task.number) <= task.error;
  else if (task.type === "number_relative")
    resOk =
      task.number === 0
        ? val === 0
        : Math.abs((val - task.number) / task.number) <= task.error;
  const attempt = {
    id: newId("attempt"),
    studentId,
    taskId,
    number: val,
    result: resOk,
  };
  await db("attempts").insert(attempt);
  res.json(attempt);
});

app.get("/attempts", authenticateToken, async (req, res) =>
  res.json(
    await db("attempts").where({
      studentId: req.query.studentId,
      taskId: req.query.taskId,
    }),
  ),
);

app.get("/statistic/:type", authenticateToken, async (req, res) => {
  const { studentId, taskId, contestId, groupId } = req.query;

  if (req.params.type === "task") {
    const ok = await db("attempts")
      .where({ studentId, taskId, result: true })
      .first();
    return res.json({ result: !!ok });
  }

  const getS = async (s, c) => {
    const ts = await db("tasks").where({ contestId: c });
    let solved = 0,
      total = 0;
    for (const t of ts) {
      total += t.weight;
      if (
        await db("attempts")
          .where({ studentId: s, taskId: t.id, result: true })
          .first()
      )
        solved += t.weight;
    }
    return { solved, total };
  };

  if (req.params.type === "contest")
    return res.json(await getS(studentId, contestId));

  if (req.params.type === "group") {
    const cs = await db("contests").where({ groupId });
    let sA = 0,
      tA = 0;
    for (const c of cs) {
      const { solved, total } = await getS(studentId, c.id);
      sA += solved;
      tA += total;
    }
    return res.json({ solved: sA, total: tA });
  }

  if (req.params.type === "group-table") {
    const studentIds = await db("student_groups")
      .where({ groupId })
      .pluck("studentId");
    const contestIds = await db("contests").where({ groupId }).pluck("id");

    const result = {};
    for (const sId of studentIds) {
      result[sId] = { total: { solved: 0, total: 0 } };
      for (const cId of contestIds) {
        const stat = await getS(sId, cId);
        result[sId][cId] = stat;
        result[sId].total.solved += stat.solved;
        result[sId].total.total += stat.total;
      }
    }
    return res.json(result);
  }
});

app.post("/link/:role", authenticateToken, async (req, res) => {
  const { login, teacherId, studentId, groupId } = req.body;
  let targetId = teacherId || studentId;
  if (login) {
    const user = await db(
      req.params.role === "teacher" ? "teachers" : "students",
    )
      .where({ login: login.trim() })
      .first();
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    targetId = user.id;
  }
  const table =
    req.params.role === "teacher" ? "teacher_groups" : "student_groups";
  const col = req.params.role === "teacher" ? "teacherId" : "studentId";
  try {
    await db(table).insert({ [col]: targetId, groupId });
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: "Уже в группе" });
  }
});

app.post("/unlink/:role", authenticateToken, async (req, res) => {
  const table =
    req.params.role === "teacher" ? "teacher_groups" : "student_groups";
  const col = req.params.role === "teacher" ? "teacherId" : "studentId";
  await db(table)
    .where({
      [col]: req.body.teacherId || req.body.studentId,
      groupId: req.body.groupId,
    })
    .del();
  res.json({ ok: true });
});

const PORT = process.env.SERVER_PORT || "3001";
app.listen(PORT, () => console.log(`Server on ${PORT}`));
