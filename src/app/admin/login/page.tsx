"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/admin/inquiries");
  }

  return (
    <main className="min-h-screen bg-[#FFF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-[#EFE3E5] rounded-[24px] p-8">

        <h1 className="text-3xl font-black text-center text-[#081325]">
          Admin Login
        </h1>

        <form
          onSubmit={handleLogin}
          className="space-y-4 mt-8"
        >
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-14 border border-[#EFE3E5] rounded-xl px-4"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-14 border border-[#EFE3E5] rounded-xl px-4"
          />

          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C23B4A] text-white h-14 rounded-xl font-bold"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

      </div>
    </main>
  );
}