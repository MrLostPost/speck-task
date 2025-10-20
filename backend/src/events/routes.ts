import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { google } from "googleapis";
import { fetchAndStoreEvents, getAuthorizedClientForUser } from "../googleCalendar";


const router = Router();


//* Manual refresh of events from Google API and storing it to the DB
router.post("/refresh", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const count = await fetchAndStoreEvents(userId);
    return res.json({ ok: true, imported: count });
  } catch (e: any) {
    console.error("/api/events/refresh error", e);
    return res.status(500).json({ ok: false, error: "Failed to refresh events" });
  }
});



//* Fetch events from the database. Range 1 - 7 - 30. Default is 7
//* If the range is 30 we group by weeks, otherwise by days (ISO weeks)
router.get("/", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const rangeParam = String(req.query.range ?? "7");
  const range = ["1", "7", "30"].includes(rangeParam) ? Number(rangeParam) : 7;


  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + range - 1); //* inclusive




  //* Get events from db for range [now..end] (pretpostavka: eventi u istom danu)
  const events = await prisma.event.findMany({
    where: {
      userId,
      start: { gte: new Date(now.setHours(0, 0, 0, 0)) },
      end: { lte: new Date(end.setHours(23, 59, 59, 999)) },
    },
    orderBy: [{ start: "asc" }],
  });

  console.log("EVENTS: ", events)


  const toYMD = (d: Date) => d.toISOString().slice(0, 10);
  const getISOWeek = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    //TODO -  četvrtak je u ISO tjednu
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  //* IF range is 30 we group events by weeks.
  if (range === 30) {
    const byWeek: Record<string, any[]> = {};
    for (const e of events) {
      const key = getISOWeek(e.start);
      (byWeek[key] ||= []).push(e);
    }
    const result = Object.entries(byWeek)
      .map(([week, items]) => ({ group: week, items }))
      .sort((a, b) => (a.group < b.group ? -1 : 1));
    return res.json({ range, grouping: "week", groups: result });
  }


  //*else: group by day
  const byDay: Record<string, any[]> = {};
  for (const e of events) {
    const key = toYMD(e.start);
    (byDay[key] ||= []).push(e);
  }
  const result = Object.entries(byDay)
    .map(([day, items]) => ({ group: day, items }))
    .sort((a, b) => (a.group < b.group ? -1 : 1));


  return res.json({ range, grouping: "day", groups: result });
});



router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { title, date, startTime, endTime } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing fields" });
    }

    //* merge date and time (e.g. "2025-10-20" + "14:00")
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);


    const existing = await prisma.event.findFirst({
      where: { userId, title, start, end },
    });

    if (existing) {
      //* If exists, return existing event without the insert on google
      return res.status(200).json({
        ok: true,
        event: existing,
        deduped: true,
      });
    }

    //* Create new event on the google calendar
    const auth = await getAuthorizedClientForUser(userId);
    const calendar = google.calendar({ version: "v3", auth });

    const { data: gEvent } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });

    //* Save evend in DB
    let dbEvent;
    try {
      dbEvent = await prisma.event.create({
        data: {
          userId,
          googleEventId: gEvent.id!,
          title,
          start,
          end,
        },
      });
    } catch (err: any) {
      //* If somebody by any chance creates the same event -> Prisma P2002 (unique constraint)
      if (err.code === "P2002") {
        const existing = await prisma.event.findFirst({
          where: { userId, title, start, end },
        });
        return res.status(200).json({
          ok: true,
          event: existing,
          deduped: true,
        });
      }
      throw err;
    }

    return res.status(201).json({
      ok: true,
      event: dbEvent,
    });
  } catch (e: any) {
    console.error("POST /api/events error:", e);
    return res.status(500).json({ ok: false, error: "Failed to create event" });
  }
});

export default router;