const { Strategy, ExtractJwt } =require( 'passport-jwt');
const db =require( '../../models/index'); // Your Sequelize models

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
};

 const jwtStrategy = new Strategy(options, async (payload, done) => {
  try {
    const user = await db.User.findByPk(payload.id);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
});

module.exports = {jwtStrategy};