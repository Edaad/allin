const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        // Check if it's a Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        // Get the token without 'Bearer '
        const token = authHeader.replace('Bearer ', '');
        
        try {
            // Verify token
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            if (!verified) {
                return res.status(401).json({ message: 'Token verification failed' });
            }
            
            // Add user info to request
            req.user = verified;
            next();
        } catch (jwtError) {
            console.error('JWT Verification Error:', jwtError);
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({ message: 'Server error in authentication' });
    }
};

module.exports = auth; 