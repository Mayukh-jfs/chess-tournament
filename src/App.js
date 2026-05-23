import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [rounds, setRounds] = useState([]);
  const [roundNo, setRoundNo] = useState(1);

  // 🔄 LIVE PLAYERS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "players"), (snap) => {
      setPlayers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsub();
  }, []);

  // 🔄 LIVE ROUNDS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "rounds"), (snap) => {
      setRounds(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsub();
  }, []);

  // ➕ ADD PLAYER
  const addPlayer = async () => {
    if (!name.trim()) return;

    await addDoc(collection(db, "players"), {
      name,
      points: 0,
      opponents: [],
      createdAt: new Date(),
    });

    setName("");
  };

  // ❌ DELETE PLAYER
  const deletePlayer = async (id) => {
    await deleteDoc(doc(db, "players", id));
  };

  // ⚔️ SAFE RESULT UPDATE
  const updateResult = async (p1, p2, result) => {
    const p1Data = players.find((p) => p.id === p1);
    const p2Data = players.find((p) => p.id === p2);

    if (!p1Data || !p2Data) return;

    let p1Points = p1Data.points;
    let p2Points = p2Data.points;

    if (result === "A") p1Points += 1;
    if (result === "B") p2Points += 1;
    if (result === "D") {
      p1Points += 0.5;
      p2Points += 0.5;
    }

    await updateDoc(doc(db, "players", p1), {
      points: p1Points,
      opponents: [...new Set([...p1Data.opponents, p2])],
    });

    await updateDoc(doc(db, "players", p2), {
      points: p2Points,
      opponents: [...new Set([...p2Data.opponents, p1])],
    });
  };

  // 🧠 SWISS PAIRING (NO REPEATS + SAFE FALLBACK)
  const generateRound = async () => {
    const sorted = [...players].sort((a, b) => b.points - a.points);

    const used = new Set();
    const matches = [];

    for (let i = 0; i < sorted.length; i++) {
      const p1 = sorted[i];
      if (used.has(p1.id)) continue;

      let paired = false;

      for (let j = i + 1; j < sorted.length; j++) {
        const p2 = sorted[j];

        if (!used.has(p2.id) && !p1.opponents.includes(p2.id)) {
          matches.push({
            p1: p1.id,
            p2: p2.id,
          });

          used.add(p1.id);
          used.add(p2.id);
          paired = true;
          break;
        }
      }

      if (!paired) {
        used.add(p1.id); // fallback safety
      }
    }

    await addDoc(collection(db, "rounds"), {
      roundNo,
      matches,
      createdAt: new Date(),
    });

    setRoundNo((r) => r + 1);
  };

  const maxPoints =
    players.length > 0
      ? Math.max(...players.map((p) => p.points))
      : 0;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "900px", margin: "0 auto" }}>
      <h1>♟️ Chess Tournament System (Production Ready)</h1>

      <h3>Round: {roundNo}</h3>

      {/* CONTROLS */}
      <div style={{ marginBottom: "15px" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player name"
          style={{ marginRight: "10px" }}
        />

        <button onClick={addPlayer}>Add Player</button>

        <button onClick={generateRound} style={{ marginLeft: "10px" }}>
          Generate Round
        </button>
      </div>

      {/* LEADERBOARD */}
      <h2>🏆 Leaderboard</h2>

      {[...players]
        .sort((a, b) => b.points - a.points)
        .map((p) => (
          <div
            key={p.id}
            style={{
              padding: "10px",
              margin: "6px 0",
              borderRadius: "8px",
              background: p.points === maxPoints ? "#fff3b0" : "#f4f4f4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <b>
                {p.name} {p.points === maxPoints ? "👑" : ""}
              </b>{" "}
              — {p.points} pts
            </div>

            <button
              onClick={() => deletePlayer(p.id)}
              style={{ color: "red" }}
            >
              Delete
            </button>
          </div>
        ))}

      {/* ROUNDS */}
      <h2>⚔️ Rounds</h2>

      {rounds.map((r) => (
        <div
          key={r.id}
          style={{
            padding: "12px",
            marginBottom: "12px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <b>Round {r.roundNo}</b>

          {r.matches.map((m, i) => {
            const p1 = players.find((p) => p.id === m.p1);
            const p2 = players.find((p) => p.id === m.p2);

            if (!p1 || !p2) return null;

            return (
              <div key={i} style={{ marginTop: "8px" }}>
                <b>
                  {p1.name} vs {p2.name}
                </b>

                <div style={{ marginTop: "5px" }}>
                  <button onClick={() => updateResult(p1.id, p2.id, "A")}>
                    {p1.name} Wins
                  </button>

                  <button
                    onClick={() => updateResult(p1.id, p2.id, "B")}
                    style={{ marginLeft: "5px" }}
                  >
                    {p2.name} Wins
                  </button>

                  <button
                    onClick={() => updateResult(p1.id, p2.id, "D")}
                    style={{ marginLeft: "5px" }}
                  >
                    Draw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default App;