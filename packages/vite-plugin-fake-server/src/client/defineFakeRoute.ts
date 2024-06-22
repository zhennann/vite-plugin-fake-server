import type { OutgoingHttpHeaders } from "node:http";

import type { FakeRoute } from "../node/types";

export type FakeRouteConfig = FakeRoute[] | FakeRoute;

function patchConfig(config: FakeRoute) {
	if (!config.headers) config.headers = [] as unknown as OutgoingHttpHeaders;
	if (!config.headers["Content-Type"]) {
		config.headers["Content-Type"] = "application/json";
	}
}

export function defineFakeRoute(config: FakeRouteConfig) {
	if (Array.isArray(config)) {
		config.forEach((item) => patchConfig(item));
	} else {
		patchConfig(config);
	}
	return config;
}
