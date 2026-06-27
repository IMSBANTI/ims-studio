import { cookies } from "next/headers";
import prisma from "./db";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roleName: string;
  departmentName: string;
}

export async function login(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.password !== password) {
    return null;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    roleName: user.roleName,
    departmentName: user.departmentName,
  };

  // Set the session cookie. In a real production app, this should be an encrypted JWT.
  // For our MVP, base64 encoding the user session is clean, simple, and self-contained.
  const serialized = Buffer.from(JSON.stringify(sessionUser)).toString("base64");
  
  cookies().set("ims_session", serialized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return sessionUser;
}

export async function logout(): Promise<void> {
  cookies().delete("ims_session");
}

export function getSession(): SessionUser | null {
  const cookieStore = cookies();
  const cookie = cookieStore.get("ims_session");
  if (!cookie || !cookie.value) {
    return null;
  }

  try {
    const decoded = Buffer.from(cookie.value, "base64").toString("utf-8");
    return JSON.parse(decoded) as SessionUser;
  } catch (error) {
    return null;
  }
}

export function hasRole(user: SessionUser, roles: string[]): boolean {
  return roles.includes(user.roleName);
}
