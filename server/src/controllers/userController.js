import crypto from "crypto";
import streamifier from "streamifier";
import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";

const hashValue = (value) => {
  if (!value) return null;

  return crypto
    .createHash("sha256")
    .update(String(value).trim())
    .digest("hex");
};

const uploadToCloudinary = (fileBuffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "nirvaya/users",
        public_id: `user_${userId}_${Date.now()}`,
        resource_type: "image",
        transformation: [
          {
            width: 500,
            height: 500,
            crop: "fill",
            gravity: "face",
          },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

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
        created_at,
        CASE
          WHEN nid_hash IS NULL THEN false
          ELSE true
        END AS nid_submitted
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const contactsResult = await pool.query(
      `
      SELECT
        id,
        name,
        phone,
        relation,
        is_primary,
        created_at
      FROM emergency_contacts
      WHERE user_id = $1
      ORDER BY is_primary DESC, created_at ASC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      user: userResult.rows[0],
      emergency_contacts: contactsResult.rows,
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// PATCH /api/users/profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      email,
      nid,
      birth_date,
      gender,
    } = req.body;

    if (gender && !["female", "male", "other"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be female, male, or other",
      });
    }

    let photoUrl = null;

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer, userId);
      photoUrl = uploadedImage.secure_url;
    }

    const nidHash = nid ? hashValue(nid) : null;

    const updateResult = await pool.query(
      `
      UPDATE users
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        nid_hash = COALESCE($3, nid_hash),
        birth_date = COALESCE($4, birth_date),
        gender = COALESCE($5, gender),
        photo_url = COALESCE($6, photo_url),
        profile_completed =
          CASE
            WHEN
              COALESCE($1, name) IS NOT NULL
              AND COALESCE($4, birth_date) IS NOT NULL
              AND COALESCE($5, gender) IS NOT NULL
              AND COALESCE($6, photo_url) IS NOT NULL
            THEN true
            ELSE profile_completed
          END
      WHERE id = $7
      RETURNING
        id,
        name,
        email,
        phone,
        birth_date,
        photo_url,
        gender,
        phone_verified,
        profile_completed,
        created_at,
        CASE
          WHEN nid_hash IS NULL THEN false
          ELSE true
        END AS nid_submitted
      `,
      [
        name || null,
        email || null,
        nidHash,
        birth_date || null,
        gender || null,
        photoUrl,
        userId,
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Update user profile error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email or NID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};