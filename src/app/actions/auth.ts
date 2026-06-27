"use server";

import { login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function handleLogin(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please fill in all fields" };
  }

  const user = await login(email, password);

  if (!user) {
    return { error: "Invalid email or password" };
  }

  // Redirect to dashboard on success
  redirect("/");
}

export async function handleLogout() {
  await logout();
  redirect("/login");
}
