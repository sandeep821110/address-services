import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const mockAxiosPost = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { post: mockAxiosPost }
}));

const authMiddleware = (await import('../src/middleware/authMiddleware.js')).default;

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, cookies: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('token from Authorization header', () => {
    it('authenticates with valid HS256 token', async () => {
      const token = jwt.sign({ id: 'user1', role: 'user' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toMatchObject({ id: 'user1', role: 'user' });
    });

    it('returns 401 when no Authorization header', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Authentication required' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 for malformed token', async () => {
      req.headers.authorization = 'Bearer not-a-valid-token';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for token signed with wrong secret', async () => {
      const token = jwt.sign({ id: 'user1' }, 'wrong-secret', { algorithm: 'HS256' });
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when Bearer prefix is missing', async () => {
      req.headers.authorization = 'SomeToken';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Authentication required' }));
    });
  });

  describe('token from cookies', () => {
    it('authenticates with valid token from accessToken cookie', async () => {
      const token = jwt.sign({ id: 'cookieUser' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
      req.cookies.accessToken = token;

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe('cookieUser');
    });

    it('sets req.refreshToken when refreshToken cookie is present', async () => {
      const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
      req.cookies.accessToken = token;
      req.cookies.refreshToken = 'my-refresh-token-value';

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.refreshToken).toBe('my-refresh-token-value');
    });

    it('does not set req.refreshToken when no refreshToken cookie', async () => {
      const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
      req.cookies.accessToken = token;

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.refreshToken).toBeUndefined();
    });

    it('prefers Authorization header over accessToken cookie when both present', async () => {
      const headerToken = jwt.sign({ id: 'fromHeader' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
      const cookieToken = jwt.sign({ id: 'fromCookie' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
      req.headers.authorization = `Bearer ${headerToken}`;
      req.cookies.accessToken = cookieToken;

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe('fromHeader');
    });
  });

  describe('JWT algorithm handling', () => {
    it('supports RS256 algorithm with public key', async () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const pubKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
      const privKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

      const origAlg = process.env.JWT_ALGORITHM;
      process.env.JWT_ALGORITHM = 'RS256';
      process.env.JWT_PUBLIC_KEY = pubKeyPem;
      const token = jwt.sign({ id: 'rsaUser' }, privKeyPem, { algorithm: 'RS256' });
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      process.env.JWT_ALGORITHM = origAlg;

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe('rsaUser');
    });

    it('rejects token with algorithm mismatch', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ id: 'user' })).toString('base64');
      const token = `${header}.${payload}.invalidsig`;
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid or expired token' })
      );
    });
  });

  describe('auth service fallback', () => {
    it('falls back to auth service when local verification fails', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { user: { id: 'fromAuthService', email: 'test@test.com', role: 'user' } }
      });

      const token = jwt.sign({ id: 'user1' }, 'different-secret', { algorithm: 'HS256' });
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(mockAxiosPost).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe('fromAuthService');
    });

    it('returns 401 when both local and auth service fail', async () => {
      mockAxiosPost.mockRejectedValue(new Error('Auth service unreachable'));

      const token = jwt.sign({ id: 'user1' }, 'different-secret', { algorithm: 'HS256' });
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(mockAxiosPost).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
