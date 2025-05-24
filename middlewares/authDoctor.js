import jwt from 'jsonwebtoken';

// doctor authentication middleware
const authDoctor = async (req, res, next) => {
    try {
        const { dtoken } = req.headers;
        if (!dtoken) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);

        // Ensure req.body is defined
        req.body = req.body || {};
        req.body.docId = token_decode.id;

        next();
    } catch (error) {
        console.error("AuthDoctor Middleware Error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            error: error.message,
        });
    }
};

export default authDoctor;