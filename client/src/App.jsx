import { useState, useEffect } from "react";
import { DataProvider, useData } from "./utils/utils";
import { Authorization } from "./components/Authorization";
import { User } from "./components/User";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { verifyMe, logout } = useData();
  const [state, setState] = useState({
    page: "loading",
    userId: "",
    isTeacher: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token)
      return setState({ page: "login", userId: "", isTeacher: false });

    verifyMe()
      .then((u) =>
        setState({
          page: "user",
          userId: u.id,
          isTeacher: u.role === "teacher",
        }),
      )
      .catch(() => {
        logout();
        setState({ page: "login", userId: "", isTeacher: false });
      });
  }, []);

  if (state.page === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Загрузка сессии...</p>
        </div>
      </div>
    );
  }

  return state.page === "user" ? (
    <User
      userId={state.userId}
      isTeacher={state.isTeacher}
      onLogout={() => {
        logout();
        setState({ page: "login", userId: "", isTeacher: false });
      }}
    />
  ) : (
    <Authorization
      onLogin={(id, teacher) =>
        setState({ page: "user", userId: id, isTeacher: teacher })
      }
    />
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
