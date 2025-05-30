import passport from 'passport';
import { jwtStrategy } from './../utils/auth/jwt.strategy';

passport.use(jwtStrategy);

export default passport;