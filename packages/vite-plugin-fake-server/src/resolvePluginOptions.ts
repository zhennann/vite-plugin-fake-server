import { existsSync } from "node:fs";
import { join } from "node:path";

import { resolveOptions as fakerResolveOptions } from "./node";
import type { VitePluginFakeServerOptions } from "./types";

export function resolvePluginOptions(options: VitePluginFakeServerOptions = {}, cwd = process.cwd()) {
	const include = Array.isArray(options.include) ? options.include : [options.include || "fake"];
	const fakerOptions = fakerResolveOptions({ ...options, include });

	for (const filePath of fakerOptions.include) {
		const absolutePath = join(cwd, filePath);
		if (!existsSync(absolutePath)) {
			throw new Error(`${filePath} folder does not exist`);
		}
	}

	return {
		...fakerOptions,
		include: fakerOptions.include,
		enableProd: options.enableProd ?? false,
		enableDev: options.enableDev ?? true,
		watch: options.watch ?? true,
		logger: options.logger ?? true,
		timeout: options.timeout,
		basename: options.basename ?? "",
		headers: options.headers ?? {},
		build: options.build ?? false,
		http2: options.http2,
		cors: options.cors ?? false,
	};
}

export type ResolvePluginOptionsType = ReturnType<typeof resolvePluginOptions>;
