/**
 * Seed the first admin user.
 * Usage: node seed-admin.js
 * Default: username=admin, password=Admin@2026!
 * Change the password immediately after first login.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) {
        console.log('⚠️  Admin user already exists. Skipping.');
        process.exit(0);
    }

    await Admin.create({
        username: 'admin',
        email: 'admin@able-wellness.com',
        password: 'Admin@2026!',
        role: 'superadmin'
    });

    console.log('✅ Admin user created:');
    console.log('   Username: admin');
    console.log('   Password: Admin@2026!');
    console.log('   ⚠️  Change this password after first login!');
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
