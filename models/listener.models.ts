import { Schema } from 'mongoose';

const listenerSchema = new Schema({
	ticker : { type: String, required: true },
	executePercent: { type: Number, required: true },
	executedCount: { type: Number, required: true },
	totalCount: { type: Number, required: true },
	completed: { type: Boolean, required: true },
});
