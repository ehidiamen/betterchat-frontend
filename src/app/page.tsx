"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "firebase/auth"; 
import { auth, db, provider, signInWithPopup, signOut } from "./firebase"; // Import Firebase auth

// Define TypeScript interfaces
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Character {
  emoji: string;
  name: string;
}

interface CustomCharacter {
  name: string;
  emoji: string;
  description: string;
}

const AI_CHARACTERS: Record<string, Character> = {
  wise_sage: { emoji: "🧙‍♂️", name: "Wise Sage" },
  pirate_friend: { emoji: "🏴‍☠️", name: "Pirate Friend" },
  afrobeat_musician: { emoji: "🎵", name: "Afrobeat Musician from Nigeria" },
  custom: { emoji: "✨", name: "Custom AI" },
};

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);// Firebase user object
  const [character, setCharacter] = useState<string>("wise_sage");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [customCharacter, setCustomCharacter] = useState<CustomCharacter | null>(null);
  const [newCharacter, setNewCharacter] = useState<CustomCharacter>({ name: "", emoji: "", description: "" });

  // Google Sign-In
  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  // Google Sign-Out
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setMessages([]); // Clear messages on logout
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Load Chat History from Firebase
  useEffect(() => {
    if (user) {
      const loadHistory = async () => {
        const docRef = doc(db, "conversations", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMessages(docSnap.data().messages as Message[]);
        }
      };
      loadHistory();

      // Load Custom AI Character
      axios
        .get(`https://betterchat-backend.onrender.com/custom_character/${user.uid}`)
        .then((res) => setCustomCharacter(res.data))
        .catch(() => setCustomCharacter(null));
    }
  }, [user]);

  // Save Custom AI Character
  const saveCustomCharacter = async () => {
    if (!user) return;

    const characterData = {
      user_id: user.uid,
      character_name: newCharacter.name,
      emoji: newCharacter.emoji,
      description: newCharacter.description,
    };

    console.log("Sending custom character data:", characterData); // Debugging

    await axios
      .post("https://betterchat-backend.onrender.com/custom_character", characterData)
      .then((res) => console.log(res.data))
      .catch((err) => console.error("Error saving character:", err.response));

    setCustomCharacter(newCharacter);
  };

  // Send Message to FastAPI Backend
  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    const res = await axios.post("https://betterchat-backend.onrender.com/chat", {
      user_id: user.uid, // Use Firebase UID as user_id
      message: input,
      character: character,
    });

    const botMessage: Message = { role: "assistant", content: res.data.response };
    setMessages((prev) => [...prev, botMessage]);

    await setDoc(doc(db, "conversations", user.uid), { messages: [...messages, userMessage, botMessage] });
    setInput("");
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
        Better Chat {AI_CHARACTERS[character]?.emoji}
      </h1>

      {!user ? (
        <div className="flex justify-center">
          <button onClick={signIn} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow mb-4">
            <p className="text-gray-700">Welcome, {user.displayName || "User"}!</p>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Logout
            </button>
          </div>

          <select className="w-full p-2 border rounded-lg mb-4" onChange={(e) => setCharacter(e.target.value)}>
            {Object.entries(AI_CHARACTERS).map(([key, char]) => (
              <option key={key} value={key}>
                {char.emoji} {char.name}
              </option>
            ))}
          </select>

          {character === "custom" && customCharacter && (
            <p className="text-gray-600 font-semibold text-center">
              {customCharacter.emoji} {customCharacter.name} - {customCharacter.description}
            </p>
          )}

          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Create a Custom AI Character</h2>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <input className="p-2 border rounded-lg" placeholder="Name" onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })} />
              <input className="p-2 border rounded-lg" placeholder="Emoji" onChange={(e) => setNewCharacter({ ...newCharacter, emoji: e.target.value })} />
              <input className="p-2 border rounded-lg" placeholder="Description" onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })} />
            </div>
            <button onClick={saveCustomCharacter} className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg">
              Save Custom AI
            </button>
          </div>



          <div className="bg-white p-4 rounded-lg shadow-md h-80 overflow-auto mb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`my-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
                  {msg.content}
                </p>
                {msg.role === "assistant" && (
                  <button onClick={() => speak(msg.content)} className="ml-2 text-blue-500">
                    🔊
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex">
            <input className="w-full p-2 border rounded-lg" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="ml-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg" onClick={sendMessage}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;