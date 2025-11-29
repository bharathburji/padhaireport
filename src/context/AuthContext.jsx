import { createContext, useContext, useState, useEffect } from "react";
import { getItem, setItem, removeItem } from "../utils/storage.js";

const AuthContext = createContext(null);

const USERS_KEY = "padhaai_users";
const CURRENT_USER_KEY = "padhaai_currentUser";

function seedInitialUsers() {
  const existing = getItem(USERS_KEY, null);
  if (existing && existing.length > 0) {
    return existing;
  }

  // teacher demo account
  const users = [
    {
      id: "teacher-1",
      name: "Class Teacher",
      email: "teacher@padhaai.com",
      password: "teacher123",
      role: "teacher",
    },
  ];

  setItem(USERS_KEY, users);
  return users;
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => seedInitialUsers());
  const [user, setUser] = useState(() => getItem(CURRENT_USER_KEY, null));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedUsers = getItem(USERS_KEY, users) || users;
    setUsers(storedUsers);

    const current = getItem(CURRENT_USER_KEY, user);
    if (current) {
      setUser(current);
    }

    setIsReady(true);
  }, []);

  const saveUsers = (updated) => {
    setUsers(updated);
    setItem(USERS_KEY, updated);
  };

  // FINAL LOGIN FUNCTION
  const login = (email, password, role) => {
    const trimmedEmail = email.trim().toLowerCase();

    const newUser = {
      id: `${role}-${Date.now()}`,
      name: trimmedEmail.split("@")[0] || "User",
      email: trimmedEmail,
      password,
      role,
    };

    const updated = [...users.filter((u) => u.email !== trimmedEmail), newUser];
    saveUsers(updated);

    setUser(newUser);
    setItem(CURRENT_USER_KEY, newUser);

    return newUser;
  };

  // ✅ FIXED LOGOUT FUNCTION AS REQUESTED
  const logout = () => {
    removeItem(CURRENT_USER_KEY);
    setUser(null);
  };

  const registerStudent = ({ name, studentId, email, password }) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedId = studentId.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      throw new Error("Email is already registered.");
    }

    if (
      users.some(
        (u) => u.studentId && u.studentId.toLowerCase() === trimmedId
      )
    ) {
      throw new Error("Student ID already exists.");
    }

    const newUser = {
      id: `student-${Date.now()}`,
      name: name.trim(),
      studentId: studentId.trim(),
      email: trimmedEmail,
      password,
      role: "student",
    };

    const updated = [...users, newUser];
    saveUsers(updated);
    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,   // ⬅️ added here exactly as you asked
        registerStudent,
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
