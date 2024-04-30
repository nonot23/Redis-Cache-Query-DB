const jwt = require("jsonwebtoken")

const auth = async (req, res, next) => {
    try {
        const token = req.headers["authtoken"]
        if (!token) {
            return res.status(401).json('No token')
        }
        const decoded = jwt.verify(token, 'jwtsecret')
        console.log(decoded)
        req.user = decoded.user
        next()
    }catch (err) {
        console.log(err)
        res.status(500).send('Server Error')
    }
}

module.exports = auth