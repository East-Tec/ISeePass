/* ISeePass 1.1.0.0 by Tecdrop. http://www.tecdrop.com/iseepass/ */

/*global document */
(function () {

	"use strict";
	var WAS_PASSWORD, allInputs, i, curInput;
	WAS_PASSWORD = "data-iseepass";

	allInputs = document.getElementsByTagName("input");
	for (i = 0; i < allInputs.length; i = i + 1) {

		/* Toggle each password field */
		curInput = allInputs[i];
		if (curInput.getAttribute(WAS_PASSWORD)) {
			curInput.setAttribute("type", "password");
			curInput.removeAttribute(WAS_PASSWORD);
		} else if (curInput.getAttribute("type") === "password") {
			curInput.setAttribute("type", "text");
			curInput.setAttribute("autocomplete", "off");
			curInput.setAttribute(WAS_PASSWORD, "true");
		}
	}
}());
