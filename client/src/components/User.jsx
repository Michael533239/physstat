import React, { useState, useEffect, useCallback } from "react";
import { useData } from "../utils/utils";
import { UserGroup } from "./UserGroup";
import {
  LogOut,
  Plus,
  Users,
  Trash2,
  LayoutDashboard,
  Clock,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function User({ userId, isTeacher, onLogout }) {
  const {
    getTeacher,
    getStudent,
    getGroup,
    addGroup,
    deleteGroup,
    unlinkStudentGroup,
    linkTeacherGroup,
    statisticGroup,
  } = useData();
  const [page, setPage] = useState(
    sessionStorage.getItem("user_page") || "menu",
  );
  const [groupId, setGroupId] = useState(
    sessionStorage.getItem("user_groupId") || "",
  );
  const [user, setUser] = useState(null);
  const [groupNames, setGroupNames] = useState({});
  const [groupStats, setGroupStats] = useState({});
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const loadedUser = await (isTeacher
        ? getTeacher(userId)
        : getStudent(userId));
      setUser(loadedUser);
      const names = {};
      const stats = {};
      for (const id of loadedUser?.groupIds || []) {
        try {
          const g = await getGroup(id);
          names[id] = g?.name || id;
          if (!isTeacher) stats[id] = await statisticGroup(userId, id);
        } catch (e) {
          console.error(e);
        }
      }
      setGroupNames(names);
      setGroupStats(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, isTeacher]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);
  useEffect(() => {
    sessionStorage.setItem("user_page", page);
    sessionStorage.setItem("user_groupId", groupId);
  }, [page, groupId]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 animate-pulse font-medium">
            Загрузка данных...
          </p>
        </div>
      </div>
    );
  }

  if (page === "menu") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="sticky top-0 z-10 glass border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                PhysStat
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-slate-900 leading-none">
                  {user?.name}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  {isTeacher ? "Преподаватель" : "Студент"}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Выйти"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Мои группы</h2>
            </div>
            {isTeacher && (
              <button
                onClick={async () => {
                  const name = prompt("Введите название группы");
                  if (name && name.trim()) {
                    const res = await addGroup({ name: name.trim() });
                    await linkTeacherGroup(userId, res.id);
                    loadUser();
                  }
                }}
                className="btn-primary"
              >
                <Plus className="w-5 h-5" />
                Создать группу
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {user?.groupIds?.map((id, index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative glass rounded-2xl border border-slate-200 p-6 card-shadow hover:ring-2 hover:ring-indigo-500/20 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Вы уверены?")) {
                          isTeacher
                            ? await deleteGroup(id)
                            : await unlinkStudentGroup(userId, id);
                          loadUser();
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      title={isTeacher ? "Удалить группу" : "Выйти из группы"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {groupNames[id]}
                  </h3>

                  {!isTeacher && groupStats[id] && (
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Ваш прогресс</span>
                        <span className="text-slate-900 font-semibold">
                          {groupStats[id].solved} / {groupStats[id].total}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(groupStats[id].solved / groupStats[id].total) * 100}%`,
                          }}
                          className="h-full bg-indigo-600 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setGroupId(id);
                      setPage("group");
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-semibold rounded-xl transition-all duration-300 group/btn"
                  >
                    Открыть группу
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!user?.groupIds || user.groupIds.length === 0) && (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  У вас пока нет групп
                </h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                  {isTeacher
                    ? "Создайте свою первую группу, чтобы пригласить учеников и начать обучение."
                    : "Попросите преподавателя добавить вас в группу по вашему логину."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <UserGroup
      userId={userId}
      isTeacher={isTeacher}
      groupId={groupId}
      onBack={() => setPage("menu")}
    />
  );
}
