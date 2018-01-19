// ==UserScript==
// @name         netflix-Echo
// @namespace    https://github.com/ketra/netflix-sync
// @version      0.1
// @description  Script to sync Netflix history to Trakt
// @author       Ketra
// @match        https://www.netflix.com/viewingactivity*
// @require http://code.jquery.com/jquery-1.12.4.min.js
// @require https://raw.githubusercontent.com/ketra/netflix-sync/ExportTest/TVmaze.js
// @require https://raw.githubusercontent.com/lodash/lodash/4.17.4/dist/lodash.core.js
// ==/UserScript==

(function() {
    'use strict';

    var header = document.getElementById('hd');
    var element = document.querySelector("li[data-reactid='20']");
    var btn = document.createElement("li");
    var t = document.createTextNode("Echo");
    btn.appendChild(t);
    insertAfter(btn,element);

    btn.addEventListener("click", function() {
        Go();
    }, false);


    function MakeJson(dat)
    {
        console.log("Making JsonFile");
        AsyncStringify(dat).then(function(jsonArray) {
            download(jsonArray, 'ViewHistory_' + new Date().toLocaleString() + '.json', 'text/plain');
        });
    }

    function AsyncStringify(text)
    {
        return new Promise(function(resolve, reject) {
            try{

                var JSONdata = JSON.stringify(text);
                //var jsonArray = dat;
                //console.log(JSONdata);
                resolve(JSONdata);
            }
            catch(err)
            {
                reject(err);
            }
        });

    }

    function Go()
    {
        $=jQuery;

        if(!document.location.href.startsWith("https://www.netflix.com/viewingactivity")) {
            alert("This sync script must be injected into the the netflix activity page.");
            throw("This sync script must be injected into the the netflix activity page.");
        }
        if($(".trakt-dialog").length > 0) {
            alert("This sync script was already executed. Please reload the page and try again.");
            throw("This sync script was already executed. Please reload the page and try again.");
        }
        var watched = GetWatched();
        fetchMovies(watched);
    }

    function GetWatched()
    {
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
        return watched;
    }

    function fetchMovies(watched) {
        var promises = [];
        var data = {
            viewhistory : new Date().toLocaleString(),
            Shows : []
        };

        watched.each(function() {
            var item = this;
            if (!isNaN(item.season))
            {
                promises.push(GetEpisode(item)); // push the Promises to our array
            }
        });

        Promise.all(promises).then(function(res) {
            //console.log(res);
            res.forEach(function(result) {
                //console.log(result);
                var Show;
                if (result !== undefined) {
                    try{
                        Show = _.find(data.Shows, function(obj) {
                            return obj.showid == result.showid;
                        });
                        //console.log(epi);
                        Show.episodes.push(result.episodes);
                    }
                    catch(err){
                    //console.log(err);
                    }
                    //console.log(epi);
                    if (Show === undefined)
                    {
                        data.Shows.push(result);
                    }
                }
            });
            MakeJson(data);
        }).catch(function(err) {
            console.log(err);
        });
    }

    function GetEpisode(item)
    {
        return new Promise(function(resolve, reject) {
            var test = $.get('https://api.tvmaze.com/singlesearch/shows?q=' + item.show + '&embed=episodes');
            test.then(function(result) {
                var eptitle = item.title.split(': ')[2];
                var episodes = result._embedded.episodes;
                var obj = $.grep(episodes, function( a ) {
                    return a.name == eptitle;
                });
                var ep = obj[0];
                var mkep = MakeEpisode(item,ep,result);
                resolve(mkep);
            });
            test.error(function(err) {
                resolve();
            });
        });

    }

    function MakeEpisode(item, ep, sh)
    {
        var Show = {};
        if (ep !== undefined)
        {
            Show.showid = sh.externals.thetvdb;
            Show.name = sh.name;
            Show.episodes = [ep];
            Show.episodes[0].watched = item.date;
            //data.episodes.push(episode);
            //episode);
        }
        return Show;
    }

    function download(text, name, type) {
        var a = document.createElement("a");
        var file = new Blob([text], {type: type});
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
    }

    function decode_date(date_str) {
        var [day, month, year] = date_str.split("/");
        year = parseInt(year) > parseInt(new Date().getFullYear().toString().substring(2)) ? year : "20" + year;
        return new Date(year, month - 1, day);
    }

    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function sleep(miliseconds) {
        var currentTime = new Date().getTime();

        while (currentTime + miliseconds >= new Date().getTime()) {
        }
    }


})();
