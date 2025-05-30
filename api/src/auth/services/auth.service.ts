import bcrypt from 'bcryptjs';
import { User } from '../interfaces/user.interface';
import { generateToken } from '../utils/auth.utils';
import db from './../../models'; // Your Sequelize models

export class AuthService {
  static async register(name: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    return db.User.create({ email, password: hashedPassword });
  }

  static async login(email: string, password: string) {
    const user = await db.User.findOne({ where: { email } });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const payload = { id: user.id, email: user.email};
    const token = generateToken(payload);

    // Omit password before returning
    const { password: _, ...userWithoutPassword } = user.get({ plain: true });
    
    return { token, user: userWithoutPassword };
  }
}