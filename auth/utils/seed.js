import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model.js';

export async function seedDefaultUser() {
  const email    = process.env.DEFAULT_USER_EMAIL    || 'admin@rcaapp.com';
  const password = process.env.DEFAULT_USER_PASSWORD || 'Admin@12345';
  const name     = process.env.DEFAULT_USER_NAME     || 'Admin';

  const existing = await UserModel.findByEmail(email);
  if (existing) {
    console.log(`✅ Default user ready  →  ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await UserModel.create({ name, email, password: hashed });

  console.log('');
  console.log('┌──────────────────────────────────────────┐');
  console.log('│         DEFAULT USER CREATED              │');
  console.log(`│  Email   : ${email.padEnd(30)}│`);
  console.log(`│  Password: ${password.padEnd(30)}│`);
  console.log('│  ⚠  Change the password after first login │');
  console.log('└──────────────────────────────────────────┘');
  console.log('');
}
