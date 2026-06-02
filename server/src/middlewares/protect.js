import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userResult = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        birth_date,
        photo_url,
        gender,
        phone_verified,
        profile_completed,
        created_at
      FROM users
      WHERE id = $1
      `,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found"
      });
    }

    req.user = userResult.rows[0];

    next();
  } catch (error) {
    console.error("Protect middleware error:", error);

    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed"
    });
  }
};

