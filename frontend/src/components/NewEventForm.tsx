import { useState } from "react";
import axios from "axios";
import { api } from "../api";

type Props = { onCreated: () => void };

export default function NewEventForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!title || !date || !startTime || !endTime) {
      setError("All fields are required");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/events", { title, date, startTime, endTime });
      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setMessage("✅ Event created successfully!");
      onCreated();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.error ??
          err.message ??
          "Failed to create event";
        setError(msg);
      } else {
        setError("Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: 8, marginBottom: 24 }}
    >
      <h3>Create new event</h3>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>

      {error && <div style={{ color: "crimson" }}>{error}</div>}
      {message && <div style={{ color: "green" }}>{message}</div>}

      <button disabled={loading} type="submit">
        {loading ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}
