import { Request, Response, NextFunction } from "express";
import UserModel from "../models/users.models";

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
	const { authorization } = req.headers;

	if (!authorization) return res.status(401).send({ message: "Unauthorized" });

	const token = authorization.split(" ")[1];
	if (!token) return res.status(401).send({ message: "Unauthorized" });

	const [username, password] = Buffer.from(token, "base64").toString("utf-8").split(":");

	const user = await UserModel.findOne({ username })
	if (!user) return res.status(401).send({ message: "Unauthorized" });
	if (user.password !== password) return res.status(401).send({ message: "Unauthorized" });

	next();
}