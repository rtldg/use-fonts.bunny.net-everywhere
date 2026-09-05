function headersListener(details) {
	return {
		...details,
		responseHeaders: details.responseHeaders.map(processCspHeader)
	};
}

function processCspHeader(h) {
	const is_csp = ["content-security-policy", "content-security-policy-report-only"].includes(h.name.toLowerCase());
	if (is_csp) {
		// Parse the CSP header in order to rewrite the parts regarding the style and font sources.
		const parsedCsp = h.value
			.split(';')
			.map(pd => {
				const parts = pd.trim().split(" ").map(v => v.trim());
				return { directive: parts[0], value: parts.slice(1).join(" ") };
			});
		// Add Fonts Bunny to style and font sources. Note that we cannot remove the Google Fonts sources
		// since that will prevent the rewriting of the actual style and font requests. I.e. the CSP need
		// to contain _both_ Google Fonts and Fonts Bunny sources for this to work.
		return {
			name: h.name,
			value: parsedCsp
				.map(pd => {
					switch (pd.directive) {
						case "style-src":
							return { ...pd, value: `${pd.value} https://fonts.bunny.net` };
						case "font-src":
							return { ...pd, value: `${pd.value} data: https://fonts.bunny.net`}
						default:
							return pd;
					}
				})
				.map(pd => `${pd.directive} ${pd.value}`)
				.join('; ')
		};
	} else {
		return h;
	}
}

function reqListener(details) {
	let url = new URL(details.url);
	if (url.hostname == "fonts.googleapis.com" && url.pathname.startsWith("/css"))
	{
		url.hostname = "fonts.bunny.net";
		url = url.toString();
		console.log(`Redirecting ${details.url} -> ${url}`);
		return {redirectUrl: url};
	}
	return;
}

browser.webRequest.onHeadersReceived.addListener(
	headersListener,
	{ urls: ["<all_urls>"], types: ["main_frame"] },
	["responseHeaders", "blocking"]
);

browser.webRequest.onBeforeRequest.addListener(
	reqListener,
	{ urls: ["<all_urls>"], types: ["stylesheet"] },
	["blocking"]
);
