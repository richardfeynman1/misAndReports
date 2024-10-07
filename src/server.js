import express from "express";
import bodyParser from "body-parser";
const { json, urlencoded } = bodyParser;
import morgan from "morgan";
import cors from "cors";
import multer from "multer";
import { connect } from "./config/db";

import contractsRouter from "./resources/contracts.router.js";
export const app = express();
app.use(urlencoded({ limit: "100mb", extended: true }));

app.disable("x-powered-by");

// console.log(process.env.ALLOWED_LIST, "ffs");
// let whitelist = JSON.parse(process.env.ALLOWED_LIST);
// let corsOptions = {
//   origin: function(item, callback) {
//     if (whitelist.indexOf(item) !== -1 || !item) {
//       callback(null, true);
//     } else {
//       console.log("not allowed coz of corsss");
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };

// app.use(cors(corsOptions));

app.use(json({ limit: "100mb" }));
app.use(urlencoded({ limit: "100mb", extended: true }));
app.use(morgan("dev"));
app.use(multer().any());

app.get("/api/v1", (req, res) => res.send("MIS Service running"));
app.use("/api/v1/contracts", contractsRouter);

export const start = async () => {
  try {
    await connect();

    app.listen(process.env.PORT, () => {
      console.log(`REST API on http://localhost:${process.env.PORT}/api/v1`);
    });
  } catch (e) {
    console.error(e);
  }
};
