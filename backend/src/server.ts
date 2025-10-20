import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./auth/routes";
import { requireAuth } from "./auth/middleware";
import { prisma } from "./db";

const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const PORT = Number(process.env.PORT || 4000);


const cookieSecret = process.env.JWT_SECRET;
if (!cookieSecret) throw new Error("Missing JWT_SECRET env var");

const app = express();
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser(cookieSecret));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);

app.get("/api/me", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!me) return res.status(404).json({ error: "Not found" });
  res.json({ id: me.id, email: me.email, name: me.name, pictureUrl: me.pictureUrl });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});