"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";

  const [loading, setLoading] = useState(true);
  const [lastPeriod, setLastPeriod] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodDays, setPeriodDays] = useState(5);
  const [flowPerDay, setFlowPerDay] = useState([]);
  const [symptoms, setSymptoms] = useState([]);

  const symptomOptions = ["Cramps","Headache","Mood Swings","Back Pain","Fatigue","Bloating"];

  // Load existing user settings
  useEffect(() => {
    const fetchSettings = async () => {
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

      if (data) {
        if (!isEditMode) {
          router.push("/dashboard"); // already set → normal flow
          return;
        }

        // Edit mode → preload
        setLastPeriod(data.last_period_date);
        setCycleLength(data.cycle_length);
        setPeriodDays(data.period_days);
        // Ensure flow_per_day is an array
        const flowArray = Array.isArray(data.flow_per_day)
          ? data.flow_per_day
          : data.flow_per_day?.replace(/[{}]/g,'').split(",") || Array(data.period_days).fill("medium");
        setFlowPerDay(flowArray);

        setSymptoms(data.symptoms?.split(", ") || []);
      } else {
        // New user → initialize flowPerDay
        setFlowPerDay(Array(periodDays).fill("medium"));
      }

      setLoading(false);
    };

    fetchSettings();
  }, [isEditMode, periodDays]);

  // Update flowPerDay length when periodDays changes
  useEffect(() => {
    setFlowPerDay(prev => {
      const newFlow = [...prev];
      while (newFlow.length < periodDays) newFlow.push("medium");
      while (newFlow.length > periodDays) newFlow.pop();
      return newFlow;
    });
  }, [periodDays]);

  const handleFlowChange = (index, value) => {
    const newFlow = [...flowPerDay];
    newFlow[index] = value;
    setFlowPerDay(newFlow);
  };

  const handleSymptomChange = (symptom) => {
    if (symptoms.includes(symptom)) setSymptoms(symptoms.filter(s => s !== symptom));
    else setSymptoms([...symptoms, symptom]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase.from("user_settings")
        .upsert([{
          user_id: user.id,
          last_period_date: lastPeriod,
          cycle_length: parseInt(cycleLength),
          period_days: parseInt(periodDays),
          flow_per_day: flowPerDay,
          symptoms: symptoms.join(", ")
        }], { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Settings saved successfully!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center bg-cover bg-center p-5 relative"
      style={{ backgroundImage: "url('/a.png')" }}
    >
      <div className="absolute inset-0 bg-pink-200/50 backdrop-blur-sm"></div>
      <ToastContainer />
      <div className="relative w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-pink-600 mb-6 text-center">
          {isEditMode ? "Edit Setup" : "Setup Your Period Tracker"}
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 p-6 rounded-2xl shadow-xl flex flex-col gap-4 w-full"
        >
          <label className="flex flex-col">Last Period Date:
            <input
              type="date"
              required
              value={lastPeriod}
              onChange={(e) => setLastPeriod(e.target.value)}
              className="border p-2 rounded mt-1"
            />
          </label>
          <label className="flex flex-col">Cycle Length (days):
            <input
              type="number"
              required
              min={20}
              max={45}
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              className="border p-2 rounded mt-1"
            />
          </label>
          <label className="flex flex-col">Period Duration (days):
            <input
              type="number"
              required
              min={2}
              max={10}
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="border p-2 rounded mt-1"
            />
          </label>

          {/* Flow per Day */}
          <div className="flex flex-col gap-2 mt-2">
            <h3 className="font-semibold text-pink-500">Flow per Day:</h3>
            {flowPerDay.map((flow, idx) => (
              <select
                key={idx}
                value={flow}
                onChange={(e) => handleFlowChange(idx, e.target.value)}
                className="border p-2 rounded"
              >
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            ))}
          </div>

          {/* Symptoms */}
          <div className="flex flex-col gap-1 mt-2">
            <h3 className="font-semibold text-pink-500">Symptoms:</h3>
            <div className="flex flex-wrap gap-2">
              {symptomOptions.map(sym => (
                <label key={sym} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={symptoms.includes(sym)}
                    onChange={() => handleSymptomChange(sym)}
                  />
                  {sym}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-pink-500 text-white px-6 py-3 rounded-xl mt-4 hover:bg-pink-600 transition font-semibold"
          >
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
}