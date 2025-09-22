import express, {Request,Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT } from "../middleware/authenticateJWT";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

const prismaClient = new PrismaClient();


 /**
 * @openapi
 * /me:
 *   get:
 *     summary: Get current logged-in user info
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Returns current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 123
 *                 email:
 *                   type: string
 *                   example: test@example.com
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
// Route to get current user info
router.get("/me", authenticateJWT, async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
    const userId = req.user.id; 
    try {
        const user = await prismaClient.user.findUnique({
            where: { id: userId },  
            select: { id: true, email: true }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out a user (client-side JWT deletion)
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */

// Route to logout user (for JWT, this is typically handled on client side)
router.post("/logout", (req: Request, res: Response) => {
  // For JWT, logout is usually handled on the client side by deleting the token.
  // Optionally, you can implement token blacklisting on server side if needed.
  res.json({ message: "Logged out successfully" });
}); 



/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in a user and return JWT
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MySecurePassword123
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 message:
 *                   type: string
 *                   example: Login successful
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid email or password
 */

//Route to login user
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Implement your login logic here (e.g., verify email and password)
  if    (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  
  const user = await prismaClient.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret is not configured" });
  }
  let token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const { password: _password, ...userWithoutPassword } = user; // Remove password before sending user object
  const response = {
      user: userWithoutPassword,
      token
  }

  // On successful login, generate and return a JWT token
  res.json({ data: response, message: "Login successful" });
});



/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MySecurePassword123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 userId:
 *                   type: string
 *       400:
 *         description: Missing email or password
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post ("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const existingUser = await prismaClient.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before storing

  try {
    const newUser = await prismaClient.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User registered successfully", userId: newUser.id });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }     
});
export default router;