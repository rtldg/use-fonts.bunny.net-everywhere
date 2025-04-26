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

browser.webRequest.onBeforeRequest.addListener(
	reqListener,
	{
		urls: [
			"<all_urls>",
		],
	},
	["blocking"]
);
