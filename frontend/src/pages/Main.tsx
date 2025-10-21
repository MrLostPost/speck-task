import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { EventsResponse } from "../types";
import DateRangeSwitcher from "../components/DateRangeSwitcher";
import EventList from "../components/EventList";
import NewEventForm from "../components/NewEventForm";
import axios from "axios";


export default function Main() {
  const navigate = useNavigate();
  const [range, setRange] = useState<1 | 7 | 30>(7);
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(false);


  const fetchEvents = useCallback(async (r: 1 | 7 | 30 = range) => {
    setLoading(true);
    try {
      const res = await api.get<EventsResponse>(`/api/events?range=${r}`);
      setData(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          // korisnik nije prijavljen — redirect na login
          navigate("/", { replace: true });
        } else {
          console.error("API error:", status, err.message);
        }
      } else {
        console.error("Unexpected error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, range]);


  useEffect(() => {
    fetchEvents(range);
  }, [fetchEvents, range]);


  async function handleRefresh() {
    setLoading(true);
    try {
      await api.post("/api/events/refresh");
      await fetchEvents(range);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",  borderBottom: "1px solid #333"}}>
        <h1 style={{marginBottom: 8, padding: 0}} >My Calendar</h1>
        <button onClick={handleRefresh} disabled={loading}>Refresh</button>
      </div>
      <div style={{marginTop: 16}}>
        <DateRangeSwitcher value={range} onChange={(v) => setRange(v)} />
      </div>


      <NewEventForm onCreated={() => fetchEvents(range)} />


      {loading ? <p>Loading…</p> : <EventList data={data} />}
    </div>
  );
}