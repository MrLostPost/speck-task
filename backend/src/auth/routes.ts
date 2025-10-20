import { Router } from "express";
import { google } from "googleapis";
import { createOAuthClient, SCOPES } from "../googleClient";
import { prisma } from "../db";
import { createSessionCookie } from "./middleware";


const router = Router();


router.get("/google", (req, res) => {
  const client = createOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline", // traži refresh_token
    prompt: "consent", // forsira da dobijemo refresh_token na svaki login u dev-u
    scope: SCOPES,
  });
  return res.redirect(url);
});


router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) return res.status(400).send("Missing code");


    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);


    // Dohvati user info
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();
    if (!userInfo.email) return res.status(400).send("No email from Google");


    // Spremi/upiši usera i tokene
    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      update: {
        name: userInfo.name ?? undefined,
        pictureUrl: userInfo.picture ?? undefined,
        googleId: userInfo.id ?? undefined,
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      create: {
        email: userInfo.email,
        name: userInfo.name ?? undefined,
        pictureUrl: userInfo.picture ?? undefined,
        googleId: userInfo.id ?? undefined,
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });


    // Postavi httpOnly signed cookie sa JWT-om
    const jwt = createSessionCookie({ userId: user.id });
    res.cookie("session", jwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // u produkciji stavi true (https)
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    const redirectTo = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    return res.redirect(redirectTo);
  } catch (e: any) {
    console.error("/auth/google/callback error", e);
    return res.status(500).send("OAuth error");
  }
});


export default router;