import { useState } from "react";
import { useData } from "../utils/utils";
import {
  LogIn,
  UserPlus,
  ChevronLeft,
  Loader2,
  GraduationCap,
  School,
} from "lucide-react";
import { motion } from "framer-motion";

export function Authorization({ onLogin }) {
  const { checkTeacher, addTeacher, checkStudent, addStudent } = useData();
  const [page, setPage] = useState("main");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    login: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setLoading(true);
    const isReg = page.startsWith("create");
    const isTeacher = page.includes("Teacher");
    if (isReg) {
      if (!form.name.trim() || !form.login.trim() || !form.password) {
        setError("Заполните все поля");
        setLoading(false);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Пароли не совпадают");
        setLoading(false);
        return;
      }
    }
    const action = isReg
      ? isTeacher
        ? addTeacher
        : addStudent
      : isTeacher
        ? checkTeacher
        : checkStudent;

    try {
      const id = await action(form);
      if (id) onLogin(id, isTeacher);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (page === "main") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass p-8 rounded-2xl card-shadow text-center space-y-8"
        >
          <div className="space-y-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              PhysStat
            </h1>
            <p className="text-slate-500">Система проверки задач по физике</p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => setPage("loginTeacher")}
              className="group relative flex items-center justify-center gap-3 p-4 bg-white border-2 border-slate-100 hover:border-indigo-600 rounded-xl transition-all duration-300"
            >
              <School className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <div className="text-left">
                <div className="font-semibold text-slate-900">Учитель</div>
                <div className="text-xs text-slate-500">
                  Управление группами и составление задач
                </div>
              </div>
            </button>
            <button
              onClick={() => setPage("loginStudent")}
              className="group relative flex items-center justify-center gap-3 p-4 bg-white border-2 border-slate-100 hover:border-indigo-600 rounded-xl transition-all duration-300"
            >
              <GraduationCap className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <div className="text-left">
                <div className="font-semibold text-slate-900">Ученик</div>
                <div className="text-xs text-slate-500">
                  Решение задач и отслеживание прогресса
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isTeacher = page.includes("Teacher");
  const isCreate = page.startsWith("create");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass p-8 rounded-2xl card-shadow"
      >
        <button
          onClick={() => setPage("main")}
          className="flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Назад
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {isCreate ? "Регистрация" : "Вход"}
            <span className="text-indigo-600 ml-2">
              {isTeacher ? "учителя" : "ученика"}
            </span>
          </h2>
          <p className="text-slate-500 mt-1">
            {isCreate
              ? "Создайте аккаунт, чтобы начать работу"
              : "С возвращением! Пожалуйста, войдите в аккаунт"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <div className="w-1 h-1 bg-red-600 rounded-full" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {isCreate && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Имя
              </label>
              <input
                className="input-field"
                placeholder=""
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Логин
            </label>
            <input
              className="input-field"
              placeholder="user_123"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {isCreate && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Подтвердите пароль
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </div>
          )}

          <button
            disabled={loading}
            onClick={submit}
            className="w-full btn-primary h-12 mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isCreate ? (
                  <UserPlus className="w-5 h-5" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {isCreate ? "Зарегистрироваться" : "Войти"}
              </>
            )}
          </button>

          {!isCreate && (
            <div className="text-center mt-6">
              <button
                onClick={() =>
                  setPage(isTeacher ? "createTeacher" : "createStudent")
                }
                className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
              >
                Нет аккаунта? <span className="font-semibold">Создать</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
