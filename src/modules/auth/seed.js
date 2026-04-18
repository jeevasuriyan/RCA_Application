import bcrypt from 'bcryptjs';
import { UserModel } from './user.model.js';

export async function seedDefaultUser() {
  const email = process.env.DEFAULT_USER_EMAIL || 'admin@rcaapp.com';
  const password = process.env.DEFAULT_USER_PASSWORD || 'Admin@12345';
  const name = process.env.DEFAULT_USER_NAME || 'Admin';

  const existing = await UserModel.findByEmail(email);
  if (existing) {
    if (!existing.isAdmin) {
      await UserModel.update(existing._id.toString(), { isAdmin: true });
    }
    console.log(`✅ Default user ready  →  ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await UserModel.create({ name, email, password: hashed, isAdmin: true });

  console.log('');
  console.log('┌──────────────────────────────────────────┐');
  console.log('│         DEFAULT USER CREATED              │');
  console.log(`│  Email   : ${email.padEnd(30)}│`);
  console.log(`│  Password: ${password.padEnd(30)}│`);
  console.log('│  ⚠  Change the password after first login │');
  console.log('└──────────────────────────────────────────┘');
  console.log('');
}
