const express = require("express");
const redis = require("redis");
const dotenv = require("dotenv").config();
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");

const client = new MongoClient(process.env.uri);

const connect = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
  }
};

router.post("/api/register", async (req, res) => {
  try {
    const db = await client.db(process.env.dbname);
    const collection = db.collection(process.env.dbusers);
    const { username, password } = req.body;

    const existingUsers = await collection.findOne({ username: username });
    if (existingUsers) {
      return res.status(400).json({ message: "มีผู้ใช้งานนี้ในระบบแล้ว" });
    }

    const salt = await bcrypt.genSalt(10); //10 หลัก
    const hashpassword = await bcrypt.hash(password, salt);
    const userData = {
      username: username,
      password: hashpassword,
    };

    const result = await collection.insertOne(userData);
    console.log("สมัครสมาชิกสำเร็จ", result.insertedId);
    res.status(200).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (err) {
    console.error("สมัครสมาชิกล้มเหลว", err);
    res.status(500).json("สมัครสมาชิกล้มเหลว");
  }
});

router.post("/api/login", async (req, res) => {
  try {
    const db = client.db(process.env.dbname);
    const collection = db.collection(process.env.dbusers);
    const { username, password } = req.body;

    const users = await collection.findOne({ username: username });
    if (!users) {
      return res.status(400).json({ message: "ไม่พบชื่อผู้ใช้" });
    }

    const Matchpass = await bcrypt.compare(password, users.password);
    if (!Matchpass) {
      //ถ้าค่าไม่ตรง !
      return res.status(400).json({ message: "รหัสผ่านผิด" });
    }

    const payload = {
      user:{
        username: users.username
      }
    }

    jwt.sign({ payload: payload}, 'jwtsecret', { expiresIn: '1d'}, (err, token) => {
      try {
        res.status(200).json({ token, payload });
      } catch (err) {
        if (err) throw err;
      }

      
    }) 

  } catch (error) {
    console.error("เข้าสู่ระบบล้มเหลว", error);
    res.status(500).json("เข้าสู่ระบบล้มเหลว");
  }
});

module.exports = router;
