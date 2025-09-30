// server/api-auth-backup/signup.ts
import { Router, Request, Response } from "express";
import { createUser } from "../lib/auth";

const router = Router();

// POST /api/auth/signup
router.post("/", async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const result = await createUser({ email, password, firstName, lastName });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
