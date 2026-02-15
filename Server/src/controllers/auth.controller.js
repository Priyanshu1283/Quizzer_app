import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import _config from "../config/config.js";
// import { publishQueue } from "../broker/rabbit.js";

export async function register(req, res) {
  try {
    const {
      email,
      password,
      fullname: { firstName, lastName },
    } = req.body;

    const isUserAlreadyExist = await userModel.findOne({ email });

    if (isUserAlreadyExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      email,
      password: hashedPassword,
      fullname: {
        firstName,
        lastName,
      },
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      _config.JWT_SECRET,
      { expiresIn: "2d" }
    );

    //send this data to Rabbit i.e. inside Queue
    // check this data manualy on cloudamqp -> LavinMQ manager -> queue -> created_queue -> get message after scrolling :gives users data here

    // await publishQueue("user_created", {
    //   id: user._id,
    //   email: user.email,
    //   fullname: user.fullname,
    //   role: user.role,
    // });

    res.cookie("token", token, { httpOnly: true });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function googleAuthCallback(req, res) {
  try {
    const user = req.user;

    // Google sends emails[] (not email[])
    const email = user.emails?.[0]?.value;
    const googleId = user.id;
    const firstName = user.name?.givenName;
    const lastName = user.name?.familyName;

    if (!email) {
      return res
        .status(400)
        .json({ message: "No email found in Google profile" });
    }

    // Check if user already exists
    const isUserAlreadyExist = await userModel.findOne({
      $or: [{ email }, { googleId }],
    });

    if (isUserAlreadyExist) {
      const token = jwt.sign(
        { id: isUserAlreadyExist._id, role: isUserAlreadyExist.role },
        _config.JWT_SECRET,
        { expiresIn: "2d" }
      );

      res.cookie("token", token, { httpOnly: true });
      // redirect to frontend dashboard after setting cookie
      return res.redirect('http://localhost:5173/dashboard');
    }

    // Create a new user if not exist
    const newUser = await userModel.create({
      googleId,
      email,
      fullname: {
        firstName,
        lastName,
      },
    });

    //send this data to Rabbit i.e. inside Queue
    // check this data manualy on cloudamqp -> LavinMQ manager -> queue -> created_queue -> get message after scrolling :gives users data here
    //send this data to Rabbit i.e. inside Queue
    // await publishQueue("user_created", {
    //   id: newUser._id,
    //   email: newUser.email,
    //   fullname: newUser.fullname,
    //   role: newUser.role,
    // });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      _config.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.cookie("token", token, { httpOnly: true });
    // redirect to frontend dashboard after signup
    return res.redirect('http://localhost:5173/dashboard');
  } catch (error) {
    console.error("Error in googleAuthCallback:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "User account not found OR Invalid email",
      });
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      _config.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.cookie("token", token, { httpOnly: true });

    return res.status(200).json({
      message: "Login successfully",
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      message: "Logout successfully",
    });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  } 
}

export async function me(req, res) {
  try {
    return res.status(200).json({
      message: "User details fetched successfully",
      user: req.user,
    });
  } catch (error) {
    console.error("Error in me:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
