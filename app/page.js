"use client"; // important! makes this a Client Component

import { useState } from "react";
import { supabase } from "../lib/supabaseClient"; // path is correct now

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

   if (isLogin) {
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) setMessage(error.message);
  else {
    setMessage("Logged in successfully!");
    // Redirect to setup page
    window.location.href = "/setup";
  }
}
  else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("Signup successful! Check your email for confirmation.");
    }

    setLoading(false);
  };

  return (
    <div
  className="flex min-h-screen items-center justify-center bg-cover bg-center relative"
  style={{ backgroundImage: "url('/a.png')" }}
>
  {/* Overlay for soft pastel effect */}
  <div className="absolute inset-0 bg-pink-200/50 backdrop-blur-sm"></div>

  {/* Login Card */}
  <div className="relative bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
    <h1 className="text-2xl font-bold text-center mb-6">
      {isLogin ? "Login" : "Sign Up"}
    </h1>
    <form onSubmit={handleAuth} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-pink-400 text-white p-3 rounded-lg hover:bg-pink-500 transition"
      >
        {loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
      </button>
    </form>

    <p className="mt-4 text-center text-sm text-gray-600">
      {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="text-pink-500 font-semibold hover:underline"
      >
        {isLogin ? "Sign Up" : "Login"}
      </button>
    </p>

    {message && <p className="mt-2 text-center text-red-500">{message}</p>}
  </div>
</div>
  );
}