"use client";

import React, { useState } from "react";
import { handleLogin } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Lock, Mail, Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await handleLogin(null, formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] p-4">
      {/* Dynamic Background Element */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black -z-10 pointer-events-none" />

      <Card className="w-full max-w-md border-zinc-800 bg-[#18181B] text-white shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-8 border-zinc-800">
          <div className="mx-auto flex items-center justify-center mb-2">
            <img src="/images/ims-logo-c.png" alt="IMS Studio Logo" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">IMS Studio</CardTitle>
          <CardDescription className="text-zinc-400 text-sm">
            Work Management System login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@ims.studio"
                  required
                  className="pl-10 border-zinc-800 bg-[#1F1F23] text-white focus:ring-studio-red placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="pl-10 border-zinc-800 bg-[#1F1F23] text-white focus:ring-studio-red placeholder:text-zinc-600"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-studio-red hover:bg-studio-red-hover text-white transition-colors py-2.5 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Quick Login Helper for Testing */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <h4 className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Server className="w-3.5 h-3.5" /> Quick Access Accounts
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="font-semibold text-zinc-300">Admin Account</div>
                <div className="text-zinc-500">admin@ims.studio</div>
                <div className="text-zinc-600 font-mono mt-0.5">password123</div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="font-semibold text-zinc-300">Studio Manager</div>
                <div className="text-zinc-500">sr.manager2d@ims.studio</div>
                <div className="text-zinc-600 font-mono mt-0.5">password123</div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="font-semibold text-zinc-300">Visualizer (2D)</div>
                <div className="text-zinc-500">vis1.2d@ims.studio</div>
                <div className="text-zinc-600 font-mono mt-0.5">password123</div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="font-semibold text-zinc-300">BD Rep</div>
                <div className="text-zinc-500">bd.sarah@ims.studio</div>
                <div className="text-zinc-600 font-mono mt-0.5">password123</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
