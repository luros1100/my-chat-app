"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";

function ChatApp({ session }: { session: any }) {
  const [users, setUsers] = useState<any[]>([]); // список всех пользователей
  const [selectedUser, setSelectedUser] = useState<any | null>(null); // выбранный собеседник
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const currentUserId = session.user.id;
  const currentUserName = session.user.email?.split('@')[0] || "Ты";

  // Загружаем список всех пользователей (кроме себя)
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("auth.users") // Supabase хранит пользователей здесь
        .select("id, email")
        .neq("id", currentUserId); // исключаем себя
      setUsers(data || []);
    };
    fetchUsers();
  }, [currentUserId]);

  // Загружаем сообщения между текущим пользователем и выбранным
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("private_messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .or(`sender_id.eq.${selectedUser.id},receiver_id.eq.${selectedUser.id}`)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };

    fetchMessages();

    // Realtime: слушаем только сообщения между этими двумя
    const channel = supabase
      .channel(`private:${currentUserId}-${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `sender_id=eq.${currentUserId},receiver_id=eq.${selectedUser.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `sender_id=eq.${selectedUser.id},receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUserId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    await supabase.from("private_messages").insert({
      content: newMessage.trim(),
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
    });

    setNewMessage("");
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Список контактов слева */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 overflow-y-auto">
        <div className="p-5 text-xl font-bold border-b border-zinc-800">
          Контакты
        </div>
        {users.length === 0 ? (
          <p className="p-5 text-zinc-500">Нет других пользователей</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`p-4 cursor-pointer hover:bg-zinc-800 ${
                selectedUser?.id === user.id ? "bg-zinc-800" : ""
              }`}
            >
              {user.email?.split('@')[0] || "Пользователь"}
            </div>
          ))
        )}
      </div>

      {/* Основной чат */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <header className="bg-zinc-900 p-5 text-xl font-bold border-b border-zinc-800">
              Чат с {selectedUser.email?.split('@')[0] || "пользователем"}
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <p className="text-center text-zinc-500 mt-10">
                  Нет сообщений. Напиши первое!
                </p>
              ) : (
                messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] px-5 py-4 rounded-3xl ${
                      msg.sender_id === currentUserId
                        ? "bg-blue-600 ml-auto"
                        : "bg-zinc-800"
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {msg.sender_id === currentUserId
                        ? currentUserName
                        : selectedUser.email?.split('@')[0] || "Собеседник"}
                    </div>
                    <div className="text-lg break-words">{msg.content}</div>
                    <div className="text-[10px] opacity-50 mt-2 text-right">
                      {new Date(msg.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={sendMessage}
              className="p-5 bg-zinc-900 border-t border-zinc-800 flex gap-3"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-zinc-800 text-white p-5 rounded-3xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Напиши сообщение..."
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-8 rounded-3xl font-medium text-lg disabled:opacity-50"
                disabled={!newMessage.trim()}
              >
                ➤
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Выбери собеседника слева
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return <ChatApp session={session} />;
}