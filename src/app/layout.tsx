import type { Metadata } from "next";
import "@/app/globals.css";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { NavigationLayout } from "@/components/navigation-layout";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IMS Studio - Work Management System",
  description: "Internal platform for IMS Studio. Track projects, teams, tasks, time tracking, and BD briefs.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = getSession();

  let notifications: any[] = [];
  if (user) {
    try {
      notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    } catch (e) {
      console.error("Failed to load notifications: ", e);
    }
  }

  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          {user ? (
            <NavigationLayout user={user} notifications={notifications}>
              {children}
            </NavigationLayout>
          ) : (
            children
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
