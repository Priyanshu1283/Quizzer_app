import express from 'express';
import * as authController from '../controllers/auth.controller.js'
import * as validationRules from '../middlewares/validations.middleware.js'
import passport from 'passport';


const router = express.Router();

router.post("/register", validationRules.registerUserValidationRule, authController.register);


// Route to initiate Google OAuth flow
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);



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