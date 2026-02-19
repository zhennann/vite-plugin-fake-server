import { writeFileSync } from "node:fs";

import { buildPackage } from "./buildPackage.js";

const pathToRegexpContent = await buildPackage("path-to-regexp");

writeFileSync("./dist-res/path-to-regexp.js", pathToRegexpContent!);
