import jwt from "jsonwebtoken";
import axios from "axios";

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.split(" ")[1];
  if (req.cookies?.authToken) return req.cookies.authToken;
  return null;
};

const verifyLocally = (token) => {
  try {
    return jwt.verify(token, getAccessSecret());
  } catch {
    return null;
  }
};

const verifyViaAuthService = async (token) => {
  const authUrl = process.env.AUTH_SERVICE_URL;
  if (!authUrl) return null;

  try {
    const { data } = await axios.post(`${authUrl}/api/auth/verify-token`, { token }, {
      timeout: 5000,
      headers: { "Content-Type": "application/json" },
    });
    return data.user || data;
  } catch {
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "NO_TOKEN",
      });
    }

    let decoded = verifyLocally(token);

    if (!decoded) {
      decoded = await verifyViaAuthService(token);
    }

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
    }

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token: missing user identifier",
        code: "INVALID_PAYLOAD",
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email || null,
      role: decoded.role || "user",
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      code: "AUTH_ERROR",
    });
  }
};

export default authMiddleware;
