import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import { generateToken } from "../utils/jwtHelper.js";

export const signup = async (req, res) => {
    try {
        const { name, email, password, bio } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Enter all essential details" });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const profileImg = req.file?.path || undefined;

        const user = await userModel.create({
            name,
            email,
            bio,
            password: hashedPassword,
            profileImg,
        });

        const token = generateToken(user._id);
        res.status(201).json({ 
            token, user: { id: user._id, name: user.name, email: user.email, bio: user.bio, profileImg: user.profileImg } 
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Signup failed" });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                profileImg: user.profileImg
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
