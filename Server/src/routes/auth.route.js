import express from 'express';
import * as authController from '../controllers/auth.controller.js'
import * as validationRules from '../middlewares/validations.middleware.js'
import passport from 'passport';
import config from '../config/config.js';


const router = express.Router();

router.post("/register", validationRules.registerUserValidationRule, authController.register);

/** Google expects `scope` on the authorize URL. Opening `/callback` with no `?code=` starts a broken flow → "Missing required parameter: scope". */
const GOOGLE_SCOPES = ['openid', 'profile', 'email'];

function redirectToGoogleStart(req, res, next) {
  const hasCode = req.query?.code;
  const hasOAuthError = req.query?.error;
  if (!hasCode && !hasOAuthError) {
    const fallback = config.CLIENT_URL || config.allowedOrigins[0] || 'http://localhost:5173';
    return res.redirect(
      302,
      `/api/auth/google?redirect=${encodeURIComponent(fallback)}`
    );
  }
  next();
}

// Route to initiate Google OAuth flow (?redirect= must match an allowed origin)
router.get('/google', (req, res, next) => {
  const q = req.query.redirect;
  let state = config.CLIENT_URL;
  if (typeof q === 'string' && config.allowedOrigins.includes(q)) {
    state = q;
  }
  passport.authenticate('google', {
    scope: GOOGLE_SCOPES,
    state,
  })(req, res, next);
});



// Callback route that Google will redirect to after authentication
router.get(
  '/google/callback',
  redirectToGoogleStart,
  passport.authenticate('google', {
    session: false,
    scope: GOOGLE_SCOPES,
  }),
  authController.googleAuthCallback
);

//login route will be here

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.get("/me", validationRules.getProfileUser, authController.me);


export default router;