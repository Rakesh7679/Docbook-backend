import jwt from 'jsonwebtoken'

//admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        const { atoken } = req.headers;
        if (!atoken) {
            return res.json({
                success: false,
                message: "No token provided",
            });
        }
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);
        // Check for a property in the payload, e.g., admin: true
        if (!token_decode.admin) {
            return res.json({
                success: false,
                message: "Invalid token",
            });
        }
        next();
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export default authAdmin;