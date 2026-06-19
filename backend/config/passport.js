const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL: '/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const username = profile.displayName.replace(/\s+/g, '_').toLowerCase();
        const avatar = profile.photos[0]?.value || '';

        // Account linking: check if user exists with this email
        let user = await User.findOne({ email });

        if (user) {
          // If the user exists but hasn't linked Google yet, link it
          let updated = false;
          if (!user.googleId) {
            user.googleId = googleId;
            updated = true;
          }
          if (user.authProvider !== 'google') {
            user.authProvider = 'google';
            updated = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            updated = true;
          }
          if (updated) {
            await user.save();
          }
          return done(null, user);
        }

        // Check if username is taken, append random suffix if it is
        let uniqueUsername = username;
        let usernameExists = await User.findOne({ username: uniqueUsername });
        while (usernameExists) {
          uniqueUsername = `${username}_${Math.floor(Math.random() * 1000)}`;
          usernameExists = await User.findOne({ username: uniqueUsername });
        }

        // Create new Google user
        user = await User.create({
          username: uniqueUsername,
          email,
          googleId,
          avatar,
          authProvider: 'google',
          role: 'author',
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
