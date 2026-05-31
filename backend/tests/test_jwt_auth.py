import unittest
import os
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException
from app.core.security import create_access_token, decode_access_token, JWT_SECRET_KEY, JWT_ALGORITHM

class TestJWTAuth(unittest.TestCase):
    def setUp(self):
        self.user_id = "test-user-123"

    def test_token_creation_and_decoding(self):
        token = create_access_token(self.user_id)
        self.assertIsInstance(token, str)
        
        decoded_user_id = decode_access_token(token)
        self.assertEqual(decoded_user_id, self.user_id)

    def test_tampered_token(self):
        token = create_access_token(self.user_id)
        # Tamper with the token signature at the end
        tampered_token = token[:-5] + "aaaaa"
        
        with self.assertRaises(HTTPException) as ctx:
            decode_access_token(tampered_token)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail, "Invalid security token")

    def test_expired_token(self):
        # Manually create an expired token using PyJWT
        now = datetime.utcnow()
        payload = {
            "sub": self.user_id,
            "iat": now - timedelta(days=10),
            "exp": now - timedelta(days=3)
        }
        expired_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        with self.assertRaises(HTTPException) as ctx:
            decode_access_token(expired_token)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail, "Token has expired")

if __name__ == "__main__":
    unittest.main()
