$=jQuery;

if(!document.location.href.startsWith("https://www.netflix.com/viewingactivity")) {
	alert("This sync script must be injected into the the netflix activity page.");
	throw("This sync script must be injected into the the netflix activity page.");
}
if($(".trakt-dialog").length > 0) {
	alert("This sync script was already executed. Please reload the page and try again.");
	throw("This sync script was already executed. Please reload the page and try again.");
}

// Load the list of watched shows from netflix.
var watched = $(".retableRow").map(function() {
	var date = $(".date", this).text();
	var text = $(".title", this).text();
	text = text.replace(": Part ", " - Part ");
	if(text.indexOf("Mystery Science Theater 3000: The Return: Season ") !== false)
		text = text.replace(": The Return: Season ", ": Season 1");
	
	var [show, season, title] = text.split(/: Season |: Series |: Collection |: "/);
	var isShow = !title ? false : true;
	title = isShow ? title.replace(/^(.*)"$/, "$1") : $(".title", this).text();
	season = parseInt(season);
	
	show = show.replace(" (U.S.)", "");
	date = decode_date(date);

	return {
		item: $(this),
		date: date,
		isShow: isShow,
		show: show,
		season: season,
		title: title
	};
});

//Posibly enumberate episode # for series

// Convert netflix date.
function decode_date(date_str) {
	var [day, month, year] = date_str.split("/");
	year = parseInt(year) > parseInt(new Date().getFullYear().toString().substring(2)) ? year : "20" + year;
	return new Date(year, month - 1, day);
}
watched.each(function() {
var item = this;
console.log(item);
});
