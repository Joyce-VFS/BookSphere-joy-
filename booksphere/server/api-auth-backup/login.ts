// server/api-auth-backup/login.ts
import { Router, Request, Response } from "express";
import { authenticateUser } from "../lib/auth";

const router = Router();

// POST /api/auth/login
router.post("/", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await authenticateUser(email, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
