import jwt from 'jsonwebtoken';

// User authentication middleware
const authUser = async (req, res, next) => {
    try {
        const { token } = req.headers;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure req.body is defined
        req.body = req.body || {};
        req.body.userId = token_decode.id;

        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export default authUser;