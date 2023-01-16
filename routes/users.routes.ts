import { handleInternalError, handleUnauthorizedError } from './../error/error.handler';
import { Router, Request, Response } from "express";
import UserModel from "../models/users.models";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
	try {
		const allUsers = await UserModel.find();
		return res.status(200).send(allUsers);
	} catch (error) {
		handleInternalError(req, res, error)
	}
})

router.post('/', async (req: Request, res: Response) => {
	try {
		const { username, email, password } = req.body;
		const user = await UserModel.create({ username, email, password });
		return res.status(201).send(user);
	} catch (error) {
		handleInternalError(req, res, error)
	}
})

router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const user = await UserModel.findById(id);
		return res.status(200).send(user);
	} catch (error: any) {
		handleInternalError(req, res, error)
	}
})

router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		return res.status(200).send(await UserModel.findByIdAndDelete(id));
	} catch (error: any) {
		handleInternalError(req, res, error)
	}
})

router.patch('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { username, email, password } = req.body;
		const user = await UserModel.findByIdAndUpdate(id, { username, email, password }, { new: true });
		return res.status(200).send(user);
	} catch (error: any) {
		handleInternalError(req, res, error)
	}
})

router.post('/login', async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		const user = await UserModel.findOne({ email, password });
		if (user && user.password === password) {
			return res.status(200).send(user);
		} else {
			handleUnauthorizedError(req, res, { message: "Invalid credentials" })
		}
	} catch (error: any) {
		handleInternalError(req, res, error)
	}
})

router.post('/logout', async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		return res.status(200).send({ message: "Logged out" });
	} catch (error) {
		handleInternalError(req, res, error)
	}
})

export default router;