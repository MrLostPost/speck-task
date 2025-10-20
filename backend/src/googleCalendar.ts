import "dotenv/config";
import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "./db";
import { createOAuthClient } from "./googleClient";

//* HElper - fetch authorized OAuth2 clienta for the user (with auto refresh logic)
export async function getAuthorizedClientForUser(userId: string): Promise<OAuth2Client> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (!user.refreshToken) throw new Error("User missing refresh token");


  const client = createOAuthClient();
  client.setCredentials({
    access_token: user.accessToken ?? undefined,
    refresh_token: user.refreshToken ?? undefined,
    expiry_date: user.tokenExpiry ? new Date(user.tokenExpiry).getTime() : undefined,
  });



  //* If the access token has expired, Google lib will do a refresh with first call 
  //* We can intercept event and store new tokens
  client.on("tokens", async (tokens) => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: tokens.access_token ?? undefined,
          refreshToken: tokens.refresh_token ?? undefined, // rijetko dolazi ponovno
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      });
    } catch (e) {
      console.error("Failed to persist refreshed tokens", e);
    }
  });


  return client;
}


export type SyncWindow = { timeMin: string; timeMax: string };


export function sixMonthWindow(): SyncWindow {
  const now = new Date();
  const min = new Date(now);
  min.setMonth(min.getMonth() - 6);
  const max = new Date(now);
  max.setMonth(max.getMonth() + 6);
  return { timeMin: min.toISOString(), timeMax: max.toISOString() };
}


//* GEt all events in range and return flatten list 
export async function fetchEventsFromGoogle(auth: OAuth2Client, window: SyncWindow): Promise<calendar_v3.Schema$Event[]> {
  const calendar = google.calendar({ version: "v3", auth });
  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined = undefined;


  do {
    const { data }: { data: calendar_v3.Schema$Events } = await calendar.events.list({
      calendarId: "primary",
      timeMin: window.timeMin,
      timeMax: window.timeMax,
      singleEvents: true,
      orderBy: "startTime",
      pageToken,
    });
    if (data.items) events.push(...data.items);
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);


  return events;
}


//* Upsert in the DB - mapping the google event -> my Event model
export async function upsertEvents(userId: string, googleEvents: calendar_v3.Schema$Event[]) {
  const ops = googleEvents
    .filter((e) => !!e.id)
    .map((e) => {
      const startIso = e.start?.dateTime ?? (e.start?.date ? new Date(e.start.date).toISOString() : undefined);
      const endIso = e.end?.dateTime ?? (e.end?.date ? new Date(e.end.date).toISOString() : undefined);
      if (!startIso || !endIso) return null; // preskoči nekompletne


      return prisma.event.upsert({
        where: { googleEventId: e.id! },
        update: {
          title: e.summary ?? "(No title)",
          start: new Date(startIso),
          end: new Date(endIso),
        },
        create: {
          userId,
          googleEventId: e.id!,
          title: e.summary ?? "(No title)",
          start: new Date(startIso),
          end: new Date(endIso),
        },
      });
    })
    .filter(Boolean) as ReturnType<typeof prisma.event.upsert>[];


  if (ops.length) await prisma.$transaction(ops);
}

//* Main function: fetch and saving
export async function fetchAndStoreEvents(userId: string, window: SyncWindow = sixMonthWindow()) {
  const client = await getAuthorizedClientForUser(userId);
  const googleEvents = await fetchEventsFromGoogle(client, window);
  await upsertEvents(userId, googleEvents);
  return googleEvents.length;
}
