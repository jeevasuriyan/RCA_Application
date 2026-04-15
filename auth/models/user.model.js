import { getDb }   from '../../db.js';
import { ObjectId } from 'mongodb';

export class UserModel {
  static get col() {
    return getDb().collection('users');
  }

  static async findByEmail(email) {
    return this.col.findOne({ email: email.toLowerCase().trim() });
  }

  static async findById(id) {
    try { return this.col.findOne({ _id: new ObjectId(id) }); }
    catch { return null; }
  }

  static async create(data) {
    const now = new Date();
    const doc = { ...data, email: data.email.toLowerCase().trim(), createdAt: now, updatedAt: now };
    const result = await this.col.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  static async update(id, updates) {
    await this.col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return this.findById(id);
  }

  static async findByResetToken(token) {
    return this.col.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  static async exists(email) {
    const n = await this.col.countDocuments({ email: email.toLowerCase().trim() });
    return n > 0;
  }
}
