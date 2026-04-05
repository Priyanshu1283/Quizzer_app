import express from 'express';
import * as authController from '../controllers/auth.controller.js'
import * as validationRules from '../middlewares/validations.middleware.js'
import passport from 'passport';
import config from '../config/config.js';


const router = express.Router();

router.post("/register", validationRules.registerUserValidationRule, authController.register);


// Route to initiate Google OAuth flow (?redirect= must match an allowed origin)
router.get('/google', (req, res, next) => {
  const q = req.query.redirect;
  let state = config.CLIENT_URL;
  if (typeof q === 'string' && config.allowedOrigins.includes(q)) {
    state = q;
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
  })(req, res, next);
});



// Callback route that Google will redirect to after authentication
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleAuthCallback
);

//login route will be here

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.get("/me", validationRules.getProfileUser, authController.me);


export default router;