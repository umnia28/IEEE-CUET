import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      email,
      phone,
      password,
      nid,
      birth_date,
      gender,
      emergency_contacts
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !nid ||
      !birth_date ||
      !gender ||
      !Array.isArray(emergency_contacts) ||
      emergency_contacts.length === 0
    ) {
      return res.status(400).json({
        message: "All fields and at least one emergency contact are required"
      });
    }

    for (const contact of emergency_contacts) {
      if (!contact.name || !contact.phone) {
        return res.status(400).json({
          message: "Each emergency contact must have name and phone"
        });
      }
    }

    const existingUser = await client.query(
      `
      SELECT id
      FROM users
      WHERE email = $1 OR phone = $2
      `,
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedNid = await bcrypt.hash(nid, 10);

    await client.query("BEGIN");

    const userResult = await client.query(
      `
      INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        nid_hash,
        birth_date,
        gender
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, name, email, phone, birth_date, gender, created_at
      `,
      [
        name,
        email,
        phone,
        hashedPassword,
        hashedNid,
        birth_date,
        gender
      ]
    );

    const user = userResult.rows[0];

    const insertedContacts = [];

    for (let i = 0; i < emergency_contacts.length; i++) {
      const contact = emergency_contacts[i];

      const contactResult = await client.query(
        `
        INSERT INTO emergency_contacts (
          user_id,
          name,
          phone,
          relation,
          is_primary
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id, name, phone, relation, is_primary
        `,
        [
          user.id,
          contact.name,
          contact.phone,
          contact.relation || null,
          contact.is_primary === true || i === 0
        ]
      );

      insertedContacts.push(contactResult.rows[0]);
    }

    await client.query("COMMIT");
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "120d"
      }
    );

    return res.status(201).json({
      token: token,
      success: true,
      message: "User registered successfully",
      user,
      emergency_contacts: insertedContacts
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

  } finally {
    client.release();
  }
};



// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password are required"
//       });
//     }

//     const userResult = await pool.query(
//       `
//       SELECT *
//       FROM users
//       WHERE email = $1
//       `,
//       [email]
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(401).json({
//         message: "Invalid credentials"
//       });
//     }

//     const user = userResult.rows[0];

//     const isMatch = await bcrypt.compare(
//       password,
//       user.password_hash
//     );

//     if (!isMatch) {
//       return res.status(401).json({
//         message: "Invalid credentials"
//       });
//     }

//     const token = jwt.sign(
//       {
//         userId: user.id,
//         email: user.email
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "120d"
//       }
//     );
//     console.log("Generated JWT token:", token);
//     return res.status(200).json({
//       success: true,
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         gender: user.gender
//       }
//     });

//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message: "Server error"
//     });
//   }
// };

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    const userResult = await pool.query(
      `
      SELECT *
      FROM users
      WHERE phone = $1
      `,
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone or password",
      });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "120d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        birth_date: user.birth_date,
        photo_url: user.photo_url,
        gender: user.gender,
        phone_verified: user.phone_verified,
        profile_completed: user.profile_completed,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

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
      user: req.user,
      emergency_contacts: contactsResult.rows
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};