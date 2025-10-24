// Controllers for user authentication and profile endpoints.
// - `loginUser` triggers OTP generation and email sending for a given email.
// - `verifyUser` validates the OTP and returns a JWT for authenticated sessions.
// - `myProfile` returns the authenticated user's profile.
// These handlers rely on environment secrets `Activation_sec` and `Jwt_sec`.
import sendMail from "../middlewares/sendMail.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

/**
 * Start the login flow by creating (or finding) a user and sending an OTP.
 * - Request body: { email }
 * - Behavior:
 *   1. Finds or creates a `User` document for the supplied email.
 *   2. Generates a 6-digit OTP and signs a short-lived verification token
 *      containing the user and OTP using `process.env.Activation_sec`.
 *   3. Sends the OTP to the user's email via `sendMail` middleware.
 * - Response: { message, verifyToken }
 */
export const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    // Find existing user by email or create a new one
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
      });
    }

    // Generate a numeric 6-digit OTP (leading zeros possible)
    const otp = Math.floor(Math.random() * 1000000);

    // Create a short-lived verification token containing user and otp.
    // The client must present this token along with the otp to verify.
    const verifyToken = jwt.sign({ user, otp }, process.env.Activation_sec, {
      expiresIn: "5m",
    });

    // Send the OTP to the user's email. `sendMail` is an async middleware.
    await sendMail(email, "ChatBot", otp);

    res.json({
      message: "Otp send to your mail",
      verifyToken,
    });
  } catch (error) {
    // Generic error response (500) with the error message
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Verify the OTP and issue a long-lived JWT for the user.
 * - Request body: { otp, verifyToken }
 * - Behavior:
 *   1. Verifies `verifyToken` using `Activation_sec` to recover the OTP and user.
 *   2. Compares the provided `otp` to the one inside the token.
 *   3. Signs and returns an authentication token (JWT) using `Jwt_sec`.
 * - Response: { message, user, token }
 */
export const verifyUser = async (req, res) => {
  try {
    const { otp, verifyToken } = req.body;

    // Will throw if token is invalid or expired
    const verify = jwt.verify(verifyToken, process.env.Activation_sec);

    if (!verify)
      return res.status(400).json({
        message: "Otp Expired",
      });

    // Ensure OTP matches the one embedded in the verification token
    if (verify.otp !== otp)
      return res.status(400).json({
        message: "Wrong otp",
      });

    // Create an auth token (JWT) for subsequent authenticated requests
    const token = jwt.sign({ _id: verify.user._id }, process.env.Jwt_sec, {
      expiresIn: "5d",
    });

    res.json({
      message: "Logged in successfully",
      user: verify.user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Return the authenticated user's profile.
 * - Requires authentication middleware to populate `req.user`.
 * - Response: User document for `req.user._id`.
 */
export const myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};