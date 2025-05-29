import passport from 'passport';
import { jwtStrategy } from '../auth/strategies/jwt.strategy';

passport.use(jwtStrategy);

export default passport;