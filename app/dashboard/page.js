"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recentPeriod, setRecentPeriod] = useState(null);
  const [predictedPeriods, setPredictedPeriods] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      // Fetch user settings
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!userSettings) {
        router.push("/setup");
        return;
      }
      setSettings(userSettings);

      // Ensure flow_per_day is array
      const flowArray = Array.isArray(userSettings.flow_per_day)
        ? userSettings.flow_per_day
        : userSettings.flow_per_day?.replace(/[{}]/g,'').split(",") || Array(userSettings.period_days).fill("medium");

      // Fetch last period log
      const { data: lastPeriodLog } = await supabase
        .from("period_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("period_start", { ascending: false })
        .limit(1)
        .single();

      const lastPeriodDate = lastPeriodLog?.period_start || userSettings.last_period_date;

      setRecentPeriod({
        period_start: lastPeriodDate,
        flow_per_day: lastPeriodLog?.flow_per_day || flowArray,
        symptoms: lastPeriodLog?.symptoms || userSettings.symptoms,
        period_days: lastPeriodLog?.period_days || userSettings.period_days,
      });

      // Generate 12-month predictions with start and end dates
      const predictions = [];
      let startDate = dayjs(lastPeriodDate);
      for (let i = 0; i < 12; i++) {
        const predictedStart = startDate.add(userSettings.cycle_length, "day");
        const predictedEnd = predictedStart.add(userSettings.period_days - 1, "day");
        predictions.push({
          start: predictedStart,
          end: predictedEnd,
        });
        startDate = predictedStart;
      }
      setPredictedPeriods(predictions);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  const normalizeFlow = (flow) => {
  if (!flow) return [];

  // If already array → perfect
  if (Array.isArray(flow)) return flow;

  // If string like "{light,medium}" → clean it
  if (typeof flow === "string") {
    return flow
      .replace(/[{}]/g, "")     // remove { }
      .replace(/\\/g, "")       // remove backslashes
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }

  return [];
};

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-start bg-cover bg-center relative p-5"
      style={{ backgroundImage: "url('/a.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-pink-200/50 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-4xl flex flex-col gap-8 mt-10">
        <h1 className="text-3xl font-bold text-center text-pink-600">Dashboard</h1>

        {/* Recent Period Info */}
        <div className="bg-white/90 p-5 rounded-2xl shadow-xl flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-pink-600">
            Recent Period: {dayjs(recentPeriod.period_start).format("DD MMM YYYY")}{" "}
            - {dayjs(recentPeriod.period_start).add(recentPeriod.period_days - 1, "day").format("DD MMM YYYY")}
          </h2>
          <p className="text-gray-700">
            Flow per day: {Array.isArray(recentPeriod.flow_per_day) ? recentPeriod.flow_per_day.join(", ") : recentPeriod.flow_per_day}
          </p>
          <p className="text-gray-700">
            Symptoms: {recentPeriod.symptoms || "None"}
          </p>
        </div>

        {/* 12-Month Predictions */}
        <div className="flex flex-col gap-4 mt-6">
          <h3 className="text-xl font-semibold text-pink-500">Next 12 Months Predictions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {predictedPeriods.map((p, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-pink-200 to-pink-300 p-4 rounded-2xl shadow-lg hover:scale-105 transform transition cursor-pointer"
              >
                <div className="text-3xl mb-2">📅</div>
                <span className="font-bold text-pink-700">
                  {p.start.format("DD MMM")} - {p.end.format("DD MMM")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center mt-6 gap-4">
          <button
            onClick={() => router.push("/setup?edit=true")}
            className="bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition font-semibold"
          >
            Edit Setup
          </button>
          <button
            onClick={() => router.push("/history")}
            className="bg-pink-400 text-white px-6 py-3 rounded-xl hover:bg-pink-500 transition font-semibold"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
}
