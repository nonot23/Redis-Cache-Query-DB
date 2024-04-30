const express = require("express")
const redis = require("redis")
const dotenv = require("dotenv").config()
const { MongoClient } = require("mongodb")
const router = express.Router()
const auth = require('../Middleware/auth')



const client = new MongoClient(process.env.uri)

const connect = async () => {
  try {
    await client.connect()
    console.log("Connected to MongoDB")
  } catch (err) {
    console.error("Error connecting to MongoDB", err)
  }
};

const close = async () => {
  try {
    await client.close()
    console.log("Close MongoDB")
  } catch (err) {
    console.error("Error close MongoDB", err)
  }
};

const redisClient = redis.createClient(process.env.redisUrl)

redisClient.on('connect', () => {
  console.log('Connected redis');
})

redisClient.on('error', err => {
  console.log('Redis Client Error', err)
})

redisClient.connect().then(() => {
  console.log('Connected to Redis');
}).catch((err) => {
  console.log(err.message);
})

const closeRedisConnection = () => {
  redisClient.quit(function (err, succeeded) {
    if (err) {
        console.error("Error closing Redis connection", err);
    } else {
        console.log("Redis connection closed");
    }
});
}

router.post('/api/products', auth , async (req, res) => {
    try {
        const products = req.body
        
        if (!products.name || !products.description || !products.price || !products.stock) {
          return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน'})
        }
        const db = client.db(process.env.dbname)
        const collection = db.collection(process.env.dbproducts)
        const product = ({
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            stock: products.stock 
        })
        const result = await collection.insertOne(product);
        res.status(200).json({ products: 'เพิ่มสินค้าสำเร็จ'})

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'เพื่มสินค้าล้มเหลว'})
    }
})

router.get('/api/products/:id', auth , async (req, res) => {
  try {
      const id = parseInt(req.params.id)
      const db = client.db(process.env.dbname)
      const collection = db.collection(process.env.dbproducts)

      const products = await collection.findOne( { id: id })
      if(!products) {
        return res.status(404).json({ message: 'ไม่พบสินค้า'})
      }
      res.status(200).json(products)
    
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'แสดงข้อมูลสินค้าล้มเหลว'})
  } 
})

router.get('/products', auth, async (req, res) => {
  try {
    const redisCacheKey = `${process.env.dbname}: ${process.env.dbproducts}`
    const db = client.db(process.env.dbname)
    const collection = db.collection(process.env.dbproducts)
    const products = await collection.find().toArray()
    redisClient.setEx(redisCacheKey, 60, JSON.stringify(products))
    res.status(200).json(products)
    
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'ค้นหาข้อมูลสินค้าล้มเหลว'})
  }
})
module.exports = router;