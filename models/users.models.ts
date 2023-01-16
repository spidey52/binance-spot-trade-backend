import { Schema, model } from "mongoose";

const userSchema = new Schema({
	username: { type: String, required: true, unique: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
},
	{
		timestamps: true,
	}
)

const UserModel = model("User", userSchema);

export default UserModel;