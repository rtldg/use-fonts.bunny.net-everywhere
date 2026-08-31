function headersListener(details) {
	// Only add fonts.bunny.net to the CSP header if a CSP header already is present.
	const isReportOnly = details.responseHeaders.map(h => h.name.toLowerCase() === "content-security-policy-report-only").length > 0;
	const csp = details.responseHeaders.filter(h => h.name.toLowerCase() === (isReportOnly ?  "content-security-policy-report-only" : "content-security-policy")).map(h => h.value)[0];
	if (csp) {
		// Parse the CSP header in order to rewrite the parts regarding the style and font sources.
		const parsedCsp = csp
			.split(';')
			.map(pd => pd.trim())
			.map(pd => {
				const parts = pd.split(" ");
				return { directive: parts[0].trim(), value: parts.slice(1).map(v => v.trim()).join(" ") };
			});
		// Add Fonts Bunny to style and font sources. Note that we cannot remove the Google Fonts sources
		// since that will prevent the rewriting of the actual style and font requests. I.e. the CSP need
		// to contain _both_ Google Fonts and Fonts Bunny sources for this to work.
		const updatedCsp = parsedCsp
			.map(pd => {
				switch (pd.directive) {
					case "style-src":
						return { ...pd, value: `${pd.value} https://fonts.bunny.net` };
					case "font-src":
						return { ...pd, value: `${pd.value} data: https://fonts.bunny.net`}
					default:
						return pd;
				}
			});

		// Finally return the updated details object with the original CSP header replaced with
		// our updated header.
		return {
			...details,
			responseHeaders: [
				...details.responseHeaders.filter(h => h.name.toLowerCase() !== (isReportOnly ? "content-security-policy-report-only" : "content-security-policy")),
				{ name: isReportOnly ? "content-security-policy-report-only" : "content-security-policy", value: updatedCsp.map(pd => `${pd.directive} ${pd.value}`).join('; ') }
			]
		};
	}

	return details;
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
