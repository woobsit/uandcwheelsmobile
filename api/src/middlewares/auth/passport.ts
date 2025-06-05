import passport from 'passport';
import { jwtStrategy } from './jwt.strategy';

passport.use(jwtStrategy);

export default passport;