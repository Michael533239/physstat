import React, { useState, useEffect, useCallback } from "react";
import { useData, imageUrl } from "../utils/utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Send,
  Image as ImageIcon,
  AlertCircle,
  FileText,
  Target,
  BarChart,
  X,
  BarChart3,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";

export function UserGroupContest({
  userId,
  isTeacher,
  contestId,
  groupName,
  onBack,
}) {
  const {
    getContest,
    getTask,
    addTask,
    editTask,
    deleteTask,
    editContest,
    addAttempt,
    getAttempts,
    statisticTask,
    statisticContest,
    getGroup,
    getStudent,
  } = useData();

  const [page, setPage] = useState("menu");
  const [taskId, setTaskId] = useState("");
  const [contest, setContest] = useState(null);
  const [tasks, setTasks] = useState({});
  const [currentTask, setCurrentTask] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [contestTableData, setContestTableData] = useState(null);

  const [taskForm, setTaskForm] = useState({
    name: "",
    text: "",
    type: "number",
    number: "",
    error: "0",
    weight: "1",
    image: null,
    removeImage: false,
  });
  const [loading, setLoading] = useState(true);

  const loadContest = useCallback(async () => {
    try {
      setLoading(true);
      const c = await getContest(contestId);
      setContest(c);
      const tData = {};
      for (const id of c.taskIds) {
        try {
          const t = await getTask(id);
          tData[id] = {
            name: t.name,
            weight: t.weight,
            ok: isTeacher ? false : await statisticTask(userId, id),
          };
        } catch (e) {}
      }
      setTasks(tData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [contestId, userId, isTeacher]);

  useEffect(() => {
    loadContest();
  }, [loadContest]);

  const loadContestTable = useCallback(async () => {
    try {
      const c = await getContest(contestId);
      const g = await getGroup(c.groupId);
      const studentNames = {};
      for (const sId of g.studentIds) {
        try {
          const s = await getStudent(sId);
          studentNames[sId] = s.name;
        } catch (e) {}
      }
      const taskDetails = {};
      for (const tId of c.taskIds) {
        try {
          const t = await getTask(tId);
          taskDetails[tId] = { name: t.name, weight: t.weight };
        } catch (e) {}
      }
      const stats = {};
      for (const sId of g.studentIds) {
        stats[sId] = { total: { solved: 0, total: 0 } };
        for (const tId of c.taskIds) {
          const ok = await statisticTask(sId, tId);
          const w = taskDetails[tId]?.weight || 1;
          stats[sId][tId] = ok;
          stats[sId].total.total += w;
          if (ok) stats[sId].total.solved += w;
        }
      }
      setContestTableData({
        studentIds: g.studentIds,
        studentNames,
        taskIds: c.taskIds,
        taskDetails,
        stats,
      });
    } catch (e) {
      console.error(e);
    }
  }, [contestId]);

  useEffect(() => {
    if (page === "table") loadContestTable();
  }, [page, loadContestTable]);

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...taskForm,
      removeImage: taskForm.removeImage ? "true" : "false",
    };
    if (taskId) await editTask(taskId, dataToSend);
    else await addTask({ ...dataToSend, contestId });
    setPage("menu");
    loadContest();
  };

  const handleSendAttempt = async (e) => {
    e.preventDefault();
    const val = e.target.elements.ans.value;
    await addAttempt({ studentId: userId, taskId, number: val });
    e.target.elements.ans.value = "";
    const updatedAttempts = await getAttempts(userId, taskId);
    setAttempts(updatedAttempts);
    loadContest();
  };

  const getPreview = () => {
    if (!taskForm.image) return null;
    if (typeof taskForm.image === "string") return imageUrl(taskForm.image);
    return URL.createObjectURL(taskForm.image);
  };

  if (loading && !contest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Header = ({ title, subtitle, backLabel, onBackClick, actions }) => (
    <header className="sticky top-0 z-10 glass border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackClick}
            className="flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors mr-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {backLabel}
          </button>
          <div className="hidden md:block h-6 w-px bg-slate-200" />
          <div className="hidden md:block">
            <span className="text-lg font-bold text-slate-900">{title}</span>
            {subtitle && (
              <span className="text-sm text-slate-500 ml-2">{subtitle}</span>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );

  if (page === "menu") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          title={contest?.name}
          subtitle={groupName}
          backLabel="Назад к группе"
          onBackClick={onBack}
          actions={
            isTeacher && (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const n = prompt("Имя серии", contest.name);
                    if (n) {
                      await editContest(contestId, { name: n });
                      loadContest();
                    }
                  }}
                  className="btn-secondary text-sm py-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  Переименовать
                </button>
              </div>
            )
          }
        />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => setPage("table")}
              className="glass p-6 rounded-2xl border border-slate-200 card-shadow hover:ring-2 hover:ring-indigo-500/20 transition-all text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Таблица</div>
                <div className="text-xs text-slate-500">
                  Статистика по задачам
                </div>
              </div>
            </button>

            <div className="glass p-6 rounded-2xl border border-slate-200 card-shadow flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Задачи</div>
                <div className="text-xs text-slate-500">
                  {contest?.taskIds.length || 0} задач в серии
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl border border-slate-200 card-shadow overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Список задач</h3>
              {isTeacher && (
                <button
                  onClick={() => {
                    setTaskId("");
                    setTaskForm({
                      name: "",
                      text: "",
                      type: "number",
                      number: "",
                      error: "0",
                      weight: "1",
                      image: null,
                      removeImage: false,
                    });
                    setPage("edit");
                  }}
                  className="btn-primary text-sm py-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Новая задача
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-50">
              {contest?.taskIds.map((id, index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group ${
                    tasks[id]?.ok ? "bg-green-50/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        tasks[id]?.ok
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={async () => {
                          setTaskId(id);
                          const t = await getTask(id);
                          if (isTeacher) {
                            setTaskForm({
                              ...t,
                              image: t.image,
                              removeImage: false,
                            });
                            setPage("edit");
                          } else {
                            setCurrentTask(t);
                            setAttempts(await getAttempts(userId, id));
                            setPage("attempt");
                          }
                        }}
                        className="text-lg font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors"
                      >
                        {tasks[id]?.name}
                      </button>
                      <div className="flex items-center gap-3 mt-0.5">
                        {tasks[id]?.ok && (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Решено
                          </span>
                        )}
                        {!isTeacher && !tasks[id]?.ok && (
                          <span className="text-xs text-slate-400">
                            Не решено
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {tasks[id]?.weight || 1} б.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isTeacher && (
                      <button
                        onClick={async () => {
                          if (confirm("Удалить задачу?")) {
                            await deleteTask(id);
                            loadContest();
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        setTaskId(id);
                        const t = await getTask(id);
                        if (isTeacher) {
                          setTaskForm({
                            ...t,
                            image: t.image,
                            removeImage: false,
                          });
                          setPage("edit");
                        } else {
                          setCurrentTask(t);
                          setAttempts(await getAttempts(userId, id));
                          setPage("attempt");
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-indigo-600"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {contest?.taskIds.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>В этой серии еще нет задач</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (page === "table") {
    const sortedStudents = contestTableData
      ? [...contestTableData.studentIds].sort((a, b) => {
          const sa = contestTableData.stats[a]?.total?.solved || 0;
          const sb = contestTableData.stats[b]?.total?.solved || 0;
          return sb - sa;
        })
      : [];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          title="Таблица результатов"
          subtitle={contest?.name}
          backLabel="Назад к серии"
          onBackClick={() => setPage("menu")}
        />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="glass rounded-2xl border border-slate-200 card-shadow overflow-hidden">
            {!contestTableData ? (
              <div className="p-12 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 sticky left-0 bg-slate-50/80 z-[1]">
                        #
                      </th>
                      <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 sticky left-10 bg-slate-50/80 z-[1]">
                        Ученик
                      </th>
                      <th className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 text-center">
                        Итого
                      </th>
                      {contestTableData.taskIds.map((tId) => (
                        <th
                          key={tId}
                          className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 text-center min-w-[80px]"
                        >
                          <div className="flex flex-col items-center">
                            <span>
                              {contestTableData.taskDetails[tId]?.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {contestTableData.taskDetails[tId]?.weight || 1}{" "}
                              б.
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedStudents
                      .toSorted((sId1, sId2) => {
                        const st1 = contestTableData.stats[sId1];
                        const totalSolved1 = st1?.total?.solved || 0;
                        const st2 = contestTableData.stats[sId2];
                        const totalSolved2 = st2?.total?.solved || 0;
                        return totalSolved2 - totalSolved1;
                      })
                      .map((sId, idx) => {
                        const st = contestTableData.stats[sId];
                        const totalSolved = st?.total?.solved || 0;
                        const totalAll = st?.total?.total || 0;
                        const pct =
                          totalAll > 0
                            ? Math.round((totalSolved / totalAll) * 100)
                            : 0;

                        return (
                          <tr
                            key={sId}
                            className="hover:bg-slate-50/30 transition-colors"
                          >
                            <td className="p-4 text-slate-400 font-medium text-sm sticky left-0 bg-white">
                              <div className="flex items-center justify-center w-6 h-6">
                                {idx === 0 && sortedStudents.length > 2 ? (
                                  <Trophy className="w-5 h-5 text-amber-500" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                            </td>
                            <td className="p-4 sticky left-10 bg-white">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-medium text-sm">
                                  {contestTableData.studentNames[sId]?.charAt(
                                    0,
                                  )}
                                </div>
                                <span className="text-slate-900 font-medium">
                                  {contestTableData.studentNames[sId]}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-indigo-600">
                                  {totalSolved}/{totalAll}
                                </span>
                                <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-500 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            {contestTableData.taskIds.map((tId) => {
                              const ok = st?.[tId];
                              return (
                                <td key={tId} className="p-4 text-center">
                                  {ok ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    {sortedStudents.length === 0 && (
                      <tr>
                        <td
                          colSpan={3 + (contestTableData?.taskIds?.length || 0)}
                          className="p-12 text-center text-slate-400"
                        >
                          В группе пока нет учеников
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (page === "attempt") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          title={currentTask?.name}
          subtitle={contest?.name}
          backLabel="Назад к серии"
          onBackClick={() => setPage("menu")}
        />

        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
          <div className="glass rounded-2xl border border-slate-200 card-shadow overflow-hidden mb-8">
            <div className="p-6 bg-white border-b border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
                  Задача
                </span>
                {tasks[taskId]?.ok && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Решено
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {currentTask.name}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg mb-8">
                {currentTask.text}
              </p>

              {currentTask.image && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mb-8 max-w-lg mx-auto">
                  <img
                    src={imageUrl(currentTask.image) || undefined}
                    alt="task"
                    className="w-full h-auto block"
                  />
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-600" />
                  Ваш ответ
                </h4>
                <form onSubmit={handleSendAttempt} className="flex gap-3">
                  <input
                    name="ans"
                    type="number"
                    step="any"
                    placeholder=""
                    required
                    autoComplete="off"
                    className="input-field flex-1 text-lg font-medium"
                  />
                  <button type="submit" className="btn-primary px-8">
                    Отправить
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 ml-2">
              <BarChart className="w-5 h-5 text-indigo-600" />
              История попыток
            </h4>
            {attempts.length === 0 ? (
              <div className="p-8 text-center glass border border-slate-200 rounded-xl text-slate-400 italic">
                Вы еще не отправляли ответы на эту задачу
              </div>
            ) : (
              <div className="grid gap-2">
                {attempts.map((attempt, index) => (
                  <div
                    key={attempt.id}
                    className={`p-4 rounded-xl flex items-center justify-between border ${
                      attempt.result
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400 font-medium">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-slate-900">
                        {attempt.number}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-bold flex items-center gap-2 ${
                        attempt.result ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {attempt.result ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Верно
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Неверно
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (page === "edit") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          title={taskId ? "Редактирование задачи" : "Новая задача"}
          subtitle={contest?.name}
          backLabel="Назад к серии"
          onBackClick={() => setPage("menu")}
        />

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <div className="bg-white rounded-2xl card-shadow border border-slate-200 overflow-hidden">
            <form onSubmit={handleSaveTask} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Название задачи
                  </label>
                  <input
                    className="input-field font-medium"
                    placeholder=""
                    value={taskForm.name}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Текст условия
                  </label>
                  <textarea
                    rows={5}
                    className="input-field resize-none"
                    placeholder="Опишите условие задачи..."
                    value={taskForm.text}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, text: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Изображение
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                    {taskForm.image ? (
                      <div className="relative inline-block">
                        <img
                          src={getPreview()}
                          alt="Preview"
                          className="max-h-48 rounded-lg shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setTaskForm({
                              ...taskForm,
                              image: null,
                              removeImage: true,
                            })
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500 mb-3">
                          Нажмите для выбора или перетащите файл
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              image: e.target.files[0],
                              removeImage: false,
                            })
                          }
                        />
                        <span className="btn-secondary py-1 text-sm pointer-events-none">
                          Выбрать файл
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-indigo-500" />
                    Тип проверки
                  </label>
                  <select
                    value={taskForm.type}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, type: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="number">Точное значение</option>
                    <option value="number_absolute">
                      Абсолютная погрешность
                    </option>
                    <option value="number_relative">
                      Относительная погрешность
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Верный ответ
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder=""
                    className="input-field font-bold text-indigo-600"
                    value={taskForm.number}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, number: e.target.value })
                    }
                    required
                  />
                </div>

                {taskForm.type !== "number" && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Допустимая погрешность
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={
                        taskForm.type === "number_relative" ? "0.05" : "0.1"
                      }
                      className="input-field"
                      value={taskForm.error}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, error: e.target.value })
                      }
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Баллы за решение
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={taskForm.weight}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, weight: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPage("menu")}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Сохранить задачу
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }
}
