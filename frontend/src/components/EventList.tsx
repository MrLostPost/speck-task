import dayjs from "dayjs";
import type { EventsResponse } from "../types";


export default function EventList({ data }: { data: EventsResponse | null }) {
  if (!data) return <p>No data.</p>;


  return (
    <div>
      {data.groups.map((g) => (
        <div key={g.group} style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "16px 0 8px" }}>{g.group}</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {g.items.map((ev) => (
              <li
                key={ev.id}
                style={{
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: "#fff"
                }}
              >
                <div style={{ fontWeight: 600 }}>{ev.title}</div>
                <div>
                  {dayjs(ev.start).format("DD.MM.YYYY HH:mm")} - {dayjs(ev.end).format("HH:mm")}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}