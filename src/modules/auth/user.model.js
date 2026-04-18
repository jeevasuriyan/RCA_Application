import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';

export class UserModel {
  static get col() {
    return getDb().collection('users');
  }

  static async findByEmail(email) {
    return this.col.findOne({ email: email.toLowerCase().trim() });
  }

  static async findById(id) {
    try {
      return this.col.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  static async create(data) {
    const now = new Date();
    const doc = {
      ...data,
      email: data.email.toLowerCase().trim(),
      createdAt: now,
      updatedAt: now,
    };
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
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  static async exists(email) {
    const n = await this.col.countDocuments({ email: email.toLowerCase().trim() });
    return n > 0;
  }

  static async getAllUsers() {
    return this.col
      .find({}, { projection: { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } })
      .toArray();
  }

  static async deleteUser(id) {
    try {
      const result = await this.col.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }
}
