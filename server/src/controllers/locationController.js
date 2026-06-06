import pool from "../config/db.js";
import { predictRiskWithModel } from "../utils/riskModel.js";

const getBangladeshTimeOfDay = () => {
  const bdHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  if (bdHour >= 5 && bdHour < 12) return "morning";
  if (bdHour >= 12 && bdHour < 17) return "afternoon";
  if (bdHour >= 17 && bdHour < 21) return "evening";
  return "night";
};

export const updateUserLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const timeOfDay = getBangladeshTimeOfDay();

    // 1. First check known risk zone from database
    const riskZoneResult = await pool.query(
      `
      SELECT
        id,
        district,
        zone_name,
        latitude,
        longitude,
        time_of_day,
        risk_score,
        risk_level,
        radius_meters,
        (
          6371000 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )
        ) AS distance_meters
      FROM risk_zones
      WHERE time_of_day = $3
        AND (
          6371000 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )
        ) <= radius_meters
      ORDER BY risk_score DESC, distance_meters ASC
      LIMIT 1
      `,
      [latitude, longitude, timeOfDay]
    );

    let riskSource = "database";
    let riskScore = 0;
    let riskLevel = "low";
    let matchedZone = null;
    let modelPrediction = null;
    let district = "Dhaka";

    if (riskZoneResult.rows.length > 0) {
      matchedZone = riskZoneResult.rows[0];

      riskScore = Number(matchedZone.risk_score);
      riskLevel = matchedZone.risk_level;
      district = matchedZone.district || "Dhaka";
    } else {
      // 2. If no exact risk zone matched, find nearest district
      const nearestDistrictResult = await pool.query(
        `
        SELECT
          district,
          zone_name,
          (
            6371000 * acos(
              cos(radians($1)) *
              cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) *
              sin(radians(latitude))
            )
          ) AS distance_meters
        FROM risk_zones
        WHERE district IS NOT NULL
        ORDER BY distance_meters ASC
        LIMIT 1
        `,
        [latitude, longitude]
      );

      district = nearestDistrictResult.rows[0]?.district || "Dhaka";

      // 3. Then call Python model
      riskSource = "model";

      modelPrediction = await predictRiskWithModel({
        latitude,
        longitude,
        district,
      });

      riskScore = Number(modelPrediction.risk_score || 0);

      
      riskLevel = modelPrediction.risk_level || "low";

      if (riskLevel === "danger") {
        riskLevel = "critical";
      }
    }

    // 4. Save user location update
    const savedLocation = await pool.query(
      `
      INSERT INTO user_location_updates (
        user_id,
        latitude,
        longitude,
        risk_score,
        risk_level
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [userId, latitude, longitude, riskScore, riskLevel]
    );

    return res.status(201).json({
      success: true,
      message: "Location updated successfully",
      location: savedLocation.rows[0],
      risk: {
        source: riskSource,
        district,
        risk_score: riskScore,
        risk_level: riskLevel,
        time_of_day: timeOfDay,
        matched_zone: matchedZone,
        model_prediction: modelPrediction,
      },
    });
  } catch (error) {
    console.error("Update user location error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};