export type DbEvent = {
  id: string;
  userId: string;
  googleEventId?: string | null;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
};


export type EventsResponseDay = {
  range: 1 | 7;
  grouping: "day";
  groups: { group: string; items: DbEvent[] }[]; // group = YYYY-MM-DD
};


export type EventsResponseWeek = {
  range: 30;
  grouping: "week";
  groups: { group: string; items: DbEvent[] }[]; // group = YYYY-Www
};


export type EventsResponse = EventsResponseDay | EventsResponseWeek;