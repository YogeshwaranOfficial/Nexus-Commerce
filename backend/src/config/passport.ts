import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.model';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 'oauth.googleId': profile.id });

    if (!user) {
      const email = profile.emails?.[0].value;
      user = await User.findOne({ email });

      if (user) {
        user.oauth = { ...user.oauth, googleId: profile.id };
        await user.save();
      } else {
        user = await User.create({
          name: profile.displayName,
          email,
          avatar: profile.photos?.[0].value,
          isEmailVerified: true,
          oauth: { googleId: profile.id },
        });
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: process.env.GITHUB_CALLBACK_URL!,
  scope: ['user:email'],
}, async (_accessToken: string, _refreshToken: string, profile: any, done: Function) => {
  try {
    let user = await User.findOne({ 'oauth.githubId': profile.id });

    if (!user) {
      const email = profile.emails?.[0].value;
      user = await User.findOne({ email });

      if (user) {
        user.oauth = { ...user.oauth, githubId: profile.id };
        await user.save();
      } else {
        user = await User.create({
          name: profile.displayName || profile.username,
          email,
          avatar: profile.photos?.[0].value,
          isEmailVerified: true,
          oauth: { githubId: profile.id },
        });
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));
