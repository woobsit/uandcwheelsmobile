const passport =require( 'passport');
const { jwtStrategy } =require( './jwt.strategy');

passport.use(jwtStrategy);

module.exports = passport;