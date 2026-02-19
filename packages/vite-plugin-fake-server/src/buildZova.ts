import { mkdir, writeFile, rm } from "node:fs/promises";
import path, { join, relative } from "node:path";
import { existsSync } from "node:fs";

import type { ResolvedConfig } from "vite";
import * as esbuild from "esbuild";
import pc from "picocolors";

import { name } from "../package.json";

import type { ServerBuildOptions } from "./types.js";
import type { ResolvePluginOptionsType } from "./resolvePluginOptions.js";
import { getFakeFilePath } from "./node/getFakeFilePath.js";

export const PORT = 8888;
export const OUTPUT_DIR = "fakeServer";

export async function generateFakeServer(options: ResolvePluginOptionsType, config: ResolvedConfig) {
	const buildOptions = options.build === true ? { port: PORT, outDir: OUTPUT_DIR } : options.build;

	const { port = PORT, outDir = OUTPUT_DIR } = buildOptions as Required<ServerBuildOptions>;
	const cwd = process.cwd();
	const outputDir = join(cwd, outDir);

	if (!existsSync(outputDir)) {
		await mkdir(outputDir, { recursive: true });
	}

	const source = _generatorServerEntryCode(port, options, config);

	await _build(outputDir, source);

	console.log(`\n[${name}]Builded a independently service in`, pc.green(outputDir), "\n");
}

async function _build(outputDir: string, source: string) {
	const fileSrc = path.join(outputDir, "index-src.js");
	const fileDest = path.join(outputDir, "index.js");
	await writeFile(fileSrc, source, "utf-8");
	const esBuildConfig = _createEsbuildConfig(fileSrc, fileDest);
	await esbuild.build(esBuildConfig);
	await rm(fileSrc);
}

function _createEsbuildConfig(fileSrc: string, fileDest: string): esbuild.BuildOptions {
	return {
		platform: "node",
		format: "esm",
		bundle: true,
		external: ["fsevents"],
		resolveExtensions: [".mjs", ".js", ".mts", ".ts", ".json"],
		entryPoints: [fileSrc],
		outfile: fileDest,
		minify: true,
		banner: { js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);" },
	};
}

function _generatorServerEntryCode(port: number, options: ResolvePluginOptionsType, config: ResolvedConfig) {
	const { exclude, include, extensions, infixName } = options;
	let fakeFilePathArr = getFakeFilePath({ exclude, include, extensions, infixName }, process.cwd());
	fakeFilePathArr = fakeFilePathArr.map((item) => relative(process.cwd(), item));
	const mockFiles = fakeFilePathArr.map((item) => `mockFiles.push(['${item}',()=>import('../${item}')]);`);

	const options2 = { ...options, include: ["mock"] };
	return `import connect from "connect";
${options.cors ? 'import cors from "cors";' : ""}
import { createFakeMiddleware, createLogger } from "${name}";

const loggerOutput = createLogger(${JSON.stringify(config.logLevel)}, {
	allowClearScreen: ${config.clearScreen},
	// customLogger: ${config.customLogger},
});

const mockFiles=[];
${mockFiles.join("\n")}

async function main() {

	const app = connect();
	${options.cors ? "app.use(cors());" : ""}
	const middleware = await createFakeMiddleware(
		{
			...${JSON.stringify(options2, null, 2)},
			loggerOutput,
			// config.root
			root: process.cwd(),
      mockFiles,
		},
		app
	);
	app.use(middleware);

	app.listen(${port});
	console.log("Mock Server listening at port ${port}");
}

main();
`;
}
