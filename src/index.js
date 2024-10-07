import dotenv from "dotenv";
import path from "path"; // Import dirname

// console.log("dir name --->", __dirname);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { start } from "./server.js";

start();
