import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { hashPassword, comparePassword, generateToken, generateVerificationToken } from '../utils/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { User } from '../types';

const router = Router();

// Registro de usuário
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const role = 'student';

    // Verificar se email já existe
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();
    const verificationToken = generateVerificationToken();
    const now = Date.now();
    const isDev = process.env.NODE_ENV !== 'production';
    const emailVerified = isDev ? 1 : 0;

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, role, email_verified, verification_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, email, hashedPassword, name, role, emailVerified, emailVerified ? null : verificationToken, now, now);

    // Enviar email de verificação
    if (!emailVerified) {
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }
    }

    if (emailVerified) {
      const token = generateToken({
        userId,
        email,
        role,
      });

      res.status(201).json({
        token,
        user: {
          id: userId,
          email,
          name,
          role,
        },
      });
      return;
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.email_verified) {
      res.status(403).json({ error: 'Please verify your email before logging in' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verificar email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE verification_token = ?').get(token) as User | undefined;

    if (!user) {
      res.status(400).json({ error: 'Invalid verification token' });
      return;
    }

    db.prepare('UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?')
      .run(user.id);

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Solicitar redefinição de senha
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

    if (!user) {
      // Por segurança, não revelar se o email existe
      res.json({ message: 'If the email exists, a password reset link has been sent.' });
      return;
    }

    const resetToken = generateVerificationToken();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?')
      .run(resetToken, resetTokenExpiry, user.id);

    try {
      await sendPasswordResetEmail(email, user.name, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    res.json({ message: 'If the email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redefinir senha
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token) as User | undefined;

    if (!user || !user.reset_token_expiry || user.reset_token_expiry < Date.now()) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?')
      .run(hashedPassword, user.id);

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
