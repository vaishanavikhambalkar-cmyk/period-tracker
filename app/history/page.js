"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function HistoryPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user settings from Supabase
  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setSettings(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSettings();
  }, []);

  // Predefined yoga poses & daily habits (shown only once)
  const yogaPoses = [
    "Cat-Cow Stretch",
    "Bridge Pose",
    "Child's Pose",
    "Cobra Pose",
    "Seated Forward Bend",
    "Butterfly Stretch",
  ];

  const dailyActivities = [
    "Drink warm water in the morning",
    "Walk 20 minutes daily",
    "Eat fiber-rich foods",
    "Maintain sleep schedule",
    "Practice deep breathing or meditation",
  ];

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

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  if (!settings)
    return <p className="text-center mt-20 text-gray-700">No data found.</p>;

  // Generate past period dates based on last_period_date & cycle_length
  const pastPeriods = [];
  let periodDate = dayjs(settings.last_period_date);
  for (let i = 0; i < 5; i++) { // last 5 periods
    pastPeriods.push({
      period_start: periodDate.format("YYYY-MM-DD"),
      period_end: periodDate.add(settings.period_days - 1, "day").format("YYYY-MM-DD"),
      flow_per_day: settings.flow_per_day,
      symptoms: settings.symptoms,
    });
    periodDate = periodDate.subtract(settings.cycle_length, "day");
  }

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-start bg-cover bg-center relative p-5"
      style={{ backgroundImage: "url('/a.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-pink-200/50 backdrop-blur-sm"></div>
      <ToastContainer />

      <div className="relative w-full max-w-4xl flex flex-col gap-8 mt-10">
        <h1 className="text-3xl font-bold text-center text-pink-600">
          Period History
        </h1>

        {/* Yoga & Daily Activity */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/90 p-5 rounded-2xl shadow-xl">
            <h3 className="font-semibold text-pink-500 mb-2">Helpful Yoga Poses</h3>
            <ul className="list-disc list-inside text-gray-700 text-sm">
              {yogaPoses.map((pose) => (
                <li key={pose}>{pose}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white/90 p-5 rounded-2xl shadow-xl">
            <h3 className="font-semibold text-pink-500 mb-2">Daily Activities</h3>
            <ul className="list-disc list-inside text-gray-700 text-sm">
              {dailyActivities.map((act) => (
                <li key={act}>{act}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Past Periods */}
        <div className="flex flex-col gap-4 mt-4">
          {pastPeriods.map((p, idx) => (
            <div
              key={idx}
              className="bg-white/90 p-5 rounded-2xl shadow-xl flex flex-col gap-2"
            >
              <h2 className="text-lg font-semibold text-pink-600">
                {dayjs(p.period_start).format("DD MMM YYYY")} - {dayjs(p.period_end).format("DD MMM YYYY")}
              </h2>

              <p className="text-sm text-gray-700">
                Flow per day: {Array.isArray(p.flow_per_day) ? p.flow_per_day.join(", ") : p.flow_per_day || "N/A"}
              </p>
              <p className="text-sm text-gray-700">
                Symptoms: {p.symptoms || "None"}
              </p>
            </div>
          ))}
        </div>

        {/* Back to Dashboard */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}