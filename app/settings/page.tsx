"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Загружаем текущий профиль
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("nickname, status")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setNickname(data?.nickname || "");
      setStatus(data?.status || "");
    };
    loadProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Вы не авторизованы");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: nickname.trim(),
        status: status.trim(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage("Ошибка: " + error.message);
    } else {
      setMessage("Профиль обновлён!");
      setProfile({ ...profile, nickname, status });
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-md mx-auto bg-zinc-900 p-8 rounded-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Настройки профиля</h1>

        {/* Ник */}
        <label className="block mb-2 text-zinc-400">Никнейм</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full bg-zinc-800 p-4 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Статус */}
        <label className="block mb-2 text-zinc-400">Статус</label>
        <input
          type="text"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Например: онлайн, занят, сплю"
          className="w-full bg-zinc-800 p-4 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {message && (
          <p className={`text-center mb-4 ${message.includes("Ошибка") ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-medium mb-4 disabled:opacity-50"
        >
          {loading ? "Сохраняю..." : "Сохранить изменения"}
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-xl font-medium"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}