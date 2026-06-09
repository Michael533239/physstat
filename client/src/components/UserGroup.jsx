import React, { useState, useEffect, useCallback } from "react";
import { useData } from "../utils/utils";
import { UserGroupContest } from "./UserGroupContest";
import {
  ChevronLeft,
  Users,
  BookOpen,
  BarChart3,
  Plus,
  Trash2,
  Edit2,
  UserPlus,
  ChevronRight,
  GraduationCap,
  School,
  LayoutDashboard,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";

export function UserGroup({ userId, isTeacher, groupId, onBack }) {
  const {
    getGroup,
    getTeacher,
    getStudent,
    getContest,
    addContest,
    deleteContest,
    editGroup,
    linkTeacherGroupByLogin,
    linkStudentGroupByLogin,
    unlinkTeacherGroup,
    unlinkStudentGroup,
    statisticContest,
    statisticGroup,
    statisticGroupTable,
  } = useData();
  const [page, setPage] = useState("menu");
  const [contestId, setContestId] = useState("");
  const [group, setGroup] = useState(null);
  const [data, setData] = useState({
    teachers: {},
    students: {},
    contests: {},
    stats: {},
  });
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      const g = await getGroup(groupId);
      setGroup(g);
      const teachers = {};
      const students = {};
      const contests = {};
      const stats = {};

      for (const id of g.teacherIds) {
        try {
          const t = await getTeacher(id);
          teachers[id] = t.name;
        } catch (e) {}
      }
      for (const id of g.studentIds) {
        try {
          const s = await getStudent(id);
          students[id] = s.name;
          stats[id] = await statisticGroup(id, groupId);
        } catch (e) {}
      }
      for (const id of g.contestIds) {
        try {
          const c = await getContest(id);
          contests[id] = c.name;
          if (!isTeacher) stats[id] = await statisticContest(userId, id);
        } catch (e) {}
      }
      setData({ teachers, students, contests, stats });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [groupId, userId, isTeacher]);

  const loadTable = useCallback(async () => {
    try {
      const td = await statisticGroupTable(groupId);
      setTableData(td);
    } catch (e) {
      console.error(e);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    if (page === "table") loadTable();
  }, [page, loadTable]);

  if (loading && !group) {
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
          title={group?.name}
          backLabel="Назад к группам"
          onBackClick={onBack}
          actions={
            isTeacher && (
              <button
                onClick={async () => {
                  const n = prompt("Новое имя", group.name);
                  if (n) {
                    await editGroup(groupId, { name: n });
                    loadGroup();
                  }
                }}
                className="btn-secondary text-sm py-1.5"
              >
                <Edit2 className="w-4 h-4" />
                Переименовать
              </button>
            )
          }
        />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => setPage("members")}
              className="glass p-6 rounded-2xl border border-slate-200 card-shadow hover:ring-2 hover:ring-indigo-500/20 transition-all text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Участники</div>
                <div className="text-xs text-slate-500">
                  {Object.keys(data.students).length} учеников
                </div>
              </div>
            </button>

            <button
              onClick={() => setPage("table")}
              className="glass p-6 rounded-2xl border border-slate-200 card-shadow hover:ring-2 hover:ring-indigo-500/20 transition-all text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Таблица</div>
                <div className="text-xs text-slate-500">Сводная статистика</div>
              </div>
            </button>

            <div className="glass p-6 rounded-2xl border border-slate-200 card-shadow flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Задачи</div>
                <div className="text-xs text-slate-500">
                  {group.contestIds.length} серий
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl border border-slate-200 card-shadow overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Список серий</h3>
              {isTeacher && (
                <button
                  onClick={async () => {
                    const n = prompt("Название серии");
                    if (n) {
                      await addContest({ groupId, name: n });
                      loadGroup();
                    }
                  }}
                  className="btn-primary py-1.5 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Новая серия
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-50">
              {group.contestIds.map((id) => (
                <div
                  key={id}
                  className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                      {data.contests[id]?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setContestId(id);
                          setPage("contest");
                        }}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {data.contests[id]}
                      </button>
                      {!isTeacher && data.stats[id] && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${data.stats[id].total > 0 ? (data.stats[id].solved / data.stats[id].total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">
                            {data.stats[id].solved} / {data.stats[id].total}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isTeacher && (
                      <button
                        onClick={async () => {
                          if (confirm("Удалить серию?")) {
                            await deleteContest(id);
                            loadGroup();
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setContestId(id);
                        setPage("contest");
                      }}
                      className="p-2 text-slate-300 hover:text-indigo-600"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {group.contestIds.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>В этой группе пока нет серий</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (page === "members") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          title="Участники"
          subtitle={group?.name}
          backLabel="Назад к группе"
          onBackClick={() => setPage("menu")}
        />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass rounded-2xl border border-slate-200 card-shadow flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-5 h-5 text-indigo-600" />
                  Преподаватели
                </h3>
                {isTeacher && (
                  <button
                    onClick={async () => {
                      const l = prompt("Логин учителя");
                      if (l) await linkTeacherGroupByLogin(l, groupId);
                      loadGroup();
                    }}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-2 divide-y divide-slate-50">
                {group.teacherIds.map((id) => (
                  <div
                    key={id}
                    className="p-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-medium">
                        {data.teachers[id]?.charAt(0)}
                      </div>
                      <span className="text-slate-700 font-medium">
                        {data.teachers[id]}
                      </span>
                    </div>
                    {isTeacher && id !== userId && (
                      <button
                        onClick={async () => {
                          if (confirm("Удалить преподавателя?")) {
                            await unlinkTeacherGroup(id, groupId);
                            loadGroup();
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl border border-slate-200 card-shadow flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Ученики
                </h3>
                {isTeacher && (
                  <button
                    onClick={async () => {
                      const l = prompt("Логин ученика");
                      if (l) await linkStudentGroupByLogin(l, groupId);
                      loadGroup();
                    }}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-2 divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                {group.studentIds.map((id) => (
                  <div
                    key={id}
                    className="p-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-medium">
                        {data.students[id]?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-slate-700 font-medium">
                          {data.students[id]}
                        </div>
                        <div className="text-xs text-slate-500">
                          Решено: {data.stats[id]?.solved || 0} /{" "}
                          {data.stats[id]?.total || 0}
                        </div>
                      </div>
                    </div>
                    {isTeacher && (
                      <button
                        onClick={async () => {
                          if (confirm("Исключить ученика?")) {
                            await unlinkStudentGroup(id, groupId);
                            loadGroup();
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {group.studentIds.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Нет учеников
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (page === "table") {
    const sortedStudents = [...(group?.studentIds || [])].sort((a, b) => {
      const sa = tableData?.[a]?.total?.solved || 0;
      const sb = tableData?.[b]?.total?.solved || 0;
      return sb - sa;
    });

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          title="Рейтинговая таблица"
          subtitle={group?.name}
          backLabel="Назад к группе"
          onBackClick={() => setPage("menu")}
        />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="glass rounded-2xl border border-slate-200 card-shadow overflow-hidden">
            {!tableData ? (
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
                      {group.contestIds.map((id) => (
                        <th
                          key={id}
                          className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 text-center min-w-[100px]"
                        >
                          {data.contests[id]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedStudents.toSorted((sId1, sId2) => {
                      const st1 = tableData[sId1];
                      const totalSolved1 = st1?.total?.solved || 0;
                      const st2 = tableData[sId2];
                      const totalSolved2 = st2?.total?.solved || 0;
                      return totalSolved2 - totalSolved1;
                    }).map((sId, idx) => {
                      const st = tableData[sId];
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
                                {data.students[sId]?.charAt(0)}
                              </div>
                              <span className="text-slate-900 font-medium">
                                {data.students[sId]}
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
                          {group.contestIds.map((cId) => {
                            const cs = st?.[cId];
                            const cSolved = cs?.solved || 0;
                            const cTotal = cs?.total || 0;
                            const cPct =
                              cTotal > 0
                                ? Math.round((cSolved / cTotal) * 100)
                                : 0;
                            const color =
                              cPct === 100
                                ? "text-green-600"
                                : cPct > 0
                                  ? "text-amber-600"
                                  : "text-slate-400";

                            return (
                              <td key={cId} className="p-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className={`text-sm font-bold ${color}`}
                                  >
                                    {cSolved}/{cTotal}
                                  </span>
                                  <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        cPct === 100
                                          ? "bg-green-500"
                                          : cPct > 0
                                            ? "bg-amber-500"
                                            : "bg-slate-200"
                                      }`}
                                      style={{ width: `${cPct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {sortedStudents.length === 0 && (
                      <tr>
                        <td
                          colSpan={3 + group.contestIds.length}
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

  return (
    <UserGroupContest
      userId={userId}
      isTeacher={isTeacher}
      contestId={contestId}
      groupName={group?.name}
      onBack={() => setPage("menu")}
    />
  );
}
