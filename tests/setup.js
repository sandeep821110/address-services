import dotenv from 'dotenv';
dotenv.config();

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-only-secret';
process.env.AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service.test';
