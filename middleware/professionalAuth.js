const jwt = require('jsonwebtoken');
const Professional = require('../models/Professional');

// Full auth — requires approved status
async function professionalAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.PROFESSIONAL_JWT_SECRET || process.env.JWT_SECRET);
        if (decoded.type !== 'professional') return res.status(403).json({ error: 'Invalid token type' });

        const professional = await Professional.findById(decoded.id).select('-password');
        if (!professional) return res.status(404).json({ error: 'Professional not found' });
        if (professional.status !== 'approved') {
            return res.status(403).json({ error: 'Account not approved', status: professional.status });
        }

        req.professional = professional;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Light auth — allows pending professionals to check status
async function professionalAuthLight(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.PROFESSIONAL_JWT_SECRET || process.env.JWT_SECRET);
        if (decoded.type !== 'professional') return res.status(403).json({ error: 'Invalid token type' });

        const professional = await Professional.findById(decoded.id).select('-password');
        if (!professional) return res.status(404).json({ error: 'Professional not found' });

        req.professional = professional;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { professionalAuth, professionalAuthLight };
