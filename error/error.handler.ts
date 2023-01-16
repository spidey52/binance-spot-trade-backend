import { Request, Response} from "express";

export const handleInternalError = (req: Request, res: Response, error: any) => {
	res.status(500).send({ error: error.message });
}


export const handleNotFoundError = (req: Request, res: Response, error: any) => { 
	res.status(404).send({ error: error.message });
}

export const handleValidationError = (req: Request, res: Response, error: any) => { 
	res.status(400).send({ error: error.message });
}

export const handleUnauthorizedError = (req: Request, res: Response, error: any) => { 
	res.status(401).send({ error: error.message });
}

export const handleForbiddenError = (req: Request, res: Response, error: any) => { 
	res.status(403).send({ error: error.message });
}

export const handleCustomError = (req: Request, res: Response, error: any) => { 
	res.status(error.status).send({ error: error.message });
}

