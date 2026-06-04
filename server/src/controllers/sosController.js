import crypto from "crypto";
import pool from "../config/db.js";
import { io } from "../index.js";

export const startSos = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;

    const {
      latitude,
      longitude,
      trigger_type = "button",
      risk_score = null,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const publicToken = crypto.randomBytes(32).toString("hex");

    await client.query("BEGIN");

    const sosResult = await client.query(
      `
      INSERT INTO sos_alerts (
        user_id,
        trigger_type,
        latitude,
        longitude,
        risk_score,
        status,
        public_token
      )
      VALUES ($1, $2, $3, $4, $5, 'active', $6)
      RETURNING *
      `,
      [
        userId,
        trigger_type,
        latitude,
        longitude,
        risk_score,
        publicToken,
      ]
    );

    const sos = sosResult.rows[0];

    await client.query(
      `
      INSERT INTO sos_location_updates (
        sos_alert_id,
        latitude,
        longitude
      )
      VALUES ($1, $2, $3)
      `,
      [sos.id, latitude, longitude]
    );

    const contactsResult = await client.query(
      `
      SELECT name, phone, relation
      FROM emergency_contacts
      WHERE user_id = $1
      `,
      [userId]
    );

    const policeResult = await client.query(
      `
      SELECT
        id,
        name,
        phone,
        district,
        thana,
        latitude,
        longitude,
        (
          6371000 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )
        ) AS distance_meters
      FROM police_stations
      ORDER BY distance_meters ASC
      LIMIT 1
      `,
      [latitude, longitude]
    );

    await client.query("COMMIT");

    const trackingLink = `${process.env.CLIENT_URL}/track/${publicToken}`;
    const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    const smsMessage = `Nirvaya SOS Alert! ${req.user.name} needs help. Live tracking: ${trackingLink}. Initial location: ${googleMapsLink}`;

    console.log("SMS Message:", smsMessage);
    console.log("Emergency Contacts:", contactsResult.rows);
    console.log("Nearest Police:", policeResult.rows[0]);

    return res.status(201).json({
      success: true,
      message: "SOS started successfully",
      sos,
      publicToken,
      trackingLink,
      googleMapsLink,
      emergency_contacts: contactsResult.rows,
      nearest_police_station: policeResult.rows[0],
      smsMessage,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Start SOS error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

export const updateSosLocation = async (req, res) => {
  try {
    const { sosId } = req.params;
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const sosResult = await pool.query(
      `
      SELECT id, public_token, status
      FROM sos_alerts
      WHERE id = $1 AND user_id = $2
      `,
      [sosId, userId]
    );

    if (sosResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "SOS not found",
      });
    }

    const sos = sosResult.rows[0];

    if (sos.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "SOS is not active",
      });
    }

    const locationResult = await pool.query(
      `
      INSERT INTO sos_location_updates (
        sos_alert_id,
        latitude,
        longitude
      )
      VALUES ($1, $2, $3)
      RETURNING latitude, longitude, recorded_at
      `,
      [sosId, latitude, longitude]
    );

    const latestLocation = locationResult.rows[0];

    io.to(sos.public_token).emit("location_update", {
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      recorded_at: latestLocation.recorded_at,
    });

    return res.status(200).json({
      success: true,
      message: "Location updated",
      location: latestLocation,
    });
  } catch (error) {
    console.error("Update SOS location error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getTrackingLocation = async (req, res) => {
  try {
    const { publicToken } = req.params;

    const result = await pool.query(
      `
      SELECT
        sa.id,
        sa.status,
        sa.created_at,
        sa.resolved_at,
        u.name AS victim_name,
        slu.latitude,
        slu.longitude,
        slu.recorded_at
      FROM sos_alerts sa
      JOIN users u ON u.id = sa.user_id
      JOIN LATERAL (
        SELECT latitude, longitude, recorded_at
        FROM sos_location_updates
        WHERE sos_alert_id = sa.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) slu ON true
      WHERE sa.public_token = $1
      `,
      [publicToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tracking link not found",
      });
    }

    return res.status(200).json({
      success: true,
      tracking: result.rows[0],
    });
  } catch (error) {
    console.error("Get tracking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const resolveSos = async (req, res) => {
  try {
    const { sosId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `
      UPDATE sos_alerts
      SET status = 'resolved',
          resolved_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [sosId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "SOS not found",
      });
    }

    const sos = result.rows[0];

    io.to(sos.public_token).emit("sos_resolved", {
      status: "resolved",
    });

    return res.status(200).json({
      success: true,
      message: "SOS resolved",
      sos,
    });
  } catch (error) {
    console.error("Resolve SOS error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};