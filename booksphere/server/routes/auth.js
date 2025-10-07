// server/routes/auth.js
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { ObjectId } = require("mongodb");

const { createUser, authenticateUser } = require("../lib/auth");
const { connectToDatabase } = require("../lib/mongodb");

const router = express.Router();

/**
 * Helper: sendResetEmail
 * Tries to send using real SMTP if EMAIL_USER/EMAIL_PASS are present,
 * otherwise uses Ethereal test account (dev) and returns preview URL.
 *
 * Returns:
 *   { success: true, mailSent: boolean, previewUrl?: string, info?: any }
 */
async function sendResetEmail(toEmail, resetURL) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailService = process.env.EMAIL_SERVICE || "gmail";

  // If real creds are provided, try to send with them
  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: emailService,
        auth: { user: emailUser, pass: emailPass },
      });

      const mailOptions = {
        from: emailUser,
        to: toEmail,
        subject: "BookSphere Password Reset",
        text: `You requested a password reset. Use this link (valid 1 hour):\n\n${resetURL}\n\nIf you didn't request this, ignore this email.`,
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, mailSent: true, info };
    } catch (err) {
      console.error("sendResetEmail: SMTP send failed:", err);
      // fall through to Ethereal fallback
    }
  }

  // Fallback: use Ethereal test account (for development/testing)
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const mailOptions = {
      from: `"BookSphere (dev)" <${testAccount.user}>`,
      to: toEmail,
      subject: "BookSphere Password Reset (dev)",
      text: `You requested a password reset. Use this link (valid 1 hour):\n\n${resetURL}\n\n(This email was sent via Ethereal - dev only)`,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return { success: true, mailSent: false, previewUrl, info };
  } catch (err) {
    console.error("sendResetEmail: Ethereal fallback failed:", err);
    return { success: false, error: err };
  }
}

/**
 * Signup
 * POST /api/auth/signup
 * body: { email, password, firstName?, lastName? }
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // delegate to createUser (server/lib/auth.js)
    const result = await createUser({
      email: String(email).toLowerCase(),
      password,
      firstName,
      lastName,
    });

    // createUser returns an object with success/message/user/token
    if (!result || result.success === false) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Login
 * POST /api/auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const result = await authenticateUser(String(email).toLowerCase(), password);
    if (!result || result.success === false) {
      // result may include message for invalid credentials
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 * body: { email }
 *
 * Notes:
 * - Stores hashed reset token and expiry in users collection
 * - Attempts to send email (real SMTP if configured, otherwise Ethereal dev)
 * - In development you can enable DEV_EMAIL_RETURN_URL=true to return resetURL in JSON
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const { db } = await connectToDatabase();
    const users = db.collection("users");

    const normalizedEmail = String(email).toLowerCase();
    const user = await users.findOne({ email: normalizedEmail });

    // Always respond 200/generic to avoid leaking existence in prod.
    // But continue to create token and email if user exists.
    if (!user) {
      // Generic response (no token sent)
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset email has been sent",
      });
    }

    // create reset token (raw), store hashed version in DB
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expireAt = Date.now() + 60 * 60 * 1000; // 1 hour

    await users.updateOne(
      { _id: user._id },
      { $set: { resetPasswordToken: hashedToken, resetPasswordExpire: expireAt } }
    );

    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetURL = `${frontend.replace(/\/$/, "")}/reset-password?token=${resetToken}&id=${user._id}`;

    // log resetURL for local debugging
    console.log("Password reset URL (server log):", resetURL);

    // Send email (real or ethereal fallback)
    const sendResult = await sendResetEmail(user.email, resetURL);

    // If configured to return URL while developing, return it (ONLY for dev)
    const DEV_RETURN_URL = process.env.DEV_EMAIL_RETURN_URL === "true" || process.env.NODE_ENV !== "production";

    if (DEV_RETURN_URL) {
      const responseObj = {
        success: true,
        message: "Password reset (dev): check returned resetURL or email preview.",
        resetURL,
        mailSent: !!sendResult.mailSent,
      };
      if (sendResult.previewUrl) responseObj.previewUrl = sendResult.previewUrl;
      if (sendResult.info) responseObj.info = sendResult.info;
      if (sendResult.error) responseObj.error = String(sendResult.error);
      return res.json(responseObj);
    }

    // Production: generic response
    return res.json({ success: true, message: "If an account with that email exists, a reset email has been sent" });
  } catch (err) {
    console.error("Forgot-password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Reset Password
 * POST /api/auth/reset-password
 * body: { id, token, password }
 *
 * - id: user _id (ObjectId string)
 * - token: raw token from email (not hashed)
 * - password: new password
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { id, token, password } = req.body;
    if (!id || !token || !password) {
      return res.status(400).json({ success: false, message: "id, token and password are required" });
    }

    const { db } = await connectToDatabase();
    const users = db.collection("users");

    let userId;
    try {
      userId = new ObjectId(String(id));
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const user = await users.findOne({ _id: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const hashedToken = user.resetPasswordToken;
    const expire = Number(user.resetPasswordExpire || 0);

    if (!hashedToken || !expire || Date.now() > expire) {
      return res.status(400).json({ success: false, message: "Token expired or invalid" });
    }

    const isValid = await bcrypt.compare(token, hashedToken);
    if (!isValid) return res.status(400).json({ success: false, message: "Token invalid" });

    // All good -> hash new password and clear reset fields
    const newHashed = await bcrypt.hash(password, 10);
    await users.updateOne(
      { _id: userId },
      {
        $set: { passwordHash: newHashed, updatedAt: Date.now() },
        $unset: { resetPasswordToken: "", resetPasswordExpire: "" },
      }
    );

    return res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset-password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
