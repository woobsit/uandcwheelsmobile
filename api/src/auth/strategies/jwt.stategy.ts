import { Strategy, ExtractJwt } from 'passport-jwt';
import { User } from '../interfaces/user.interface';
import db from '../../models'; // Your Sequelize models

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
};

export const jwtStrategy = new Strategy(options, async (payload, done) => {
  try {
    const user = await db.User.findByPk(payload.id);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
});