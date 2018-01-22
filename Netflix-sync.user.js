// ==UserScript==
// @name         Netflix-sync
// @namespace    https://github.com/ketra/netflix-sync
// @version      0.8
// @description  Script to Sync Netflix History to Trakt.
// @author       Ketra
// @match        https://www.netflix.com/viewingactivity*
// @updateURL    https://rawgit.com/ketra/netflix-sync/Netflix-sync.user.js
// @downloadURL  https://rawgit.com/ketra/netflix-sync/Netflix-sync.user.js
// @require http://code.jquery.com/jquery-1.12.4.min.js
// @require https://maxcdn.bootstrapcdn.com/bootstrap/3.3.0/js/bootstrap.min.js
// @require https://rawgit.com/lodash/lodash/4.17.4/dist/lodash.core.js
// @require https://rawgit.com/notifyjs/notifyjs/master/dist/notify.js
// @require https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js
// ==/UserScript==

(function () {
    'use strict';

    var header = document.getElementById('hd');
    var element = document.querySelector("li[data-reactid='20']");
    var btn = document.createElement("li");
    var a = document.createElement("a");
    var t = document.createTextNode("Sync To Trakt");
    a.href='#';
    a.appendChild(t);
    btn.appendChild(a);
    insertAfter(btn, element);

    a.addEventListener("click", function () {
        Go();
    }, false);


    function MakeJson(dat)
    {
        console.log("Making JsonFile");
        AsyncStringify(dat).then(function (jsonArray) {
            download(jsonArray, 'ViewHistory_' + new Date().toLocaleString() + '.json', 'text/plain');
        });
    }

    function ShowLoader()
    {
        var fileref=document.createElement('link');
        fileref.setAttribute('rel','stylesheet');
        fileref.setAttribute('type','text/css');
        fileref.setAttribute('href','https://rawgit.com/Semantic-Org/UI-Loader/master/loader.min.css');
        document.getElementsByTagName('head')[0].appendChild(fileref);
        var htmldata = '<div id="loader" class="ui segment">  <div class="ui active inverted dimmer">    <div class="ui text massive loader">Syncing</div>  </div>  <p></p></div>';
        $(htmldata).insertAfter('#hdSpace');
    }
    function HideLoader()
    {
        $("#loader").hide();
    }

    function AsyncStringify(text)
    {
        return new Promise(function (resolve, reject) {
            try {

                var JSONdata = JSON.stringify(text);
                //var jsonArray = dat;
                //console.log(JSONdata);
                resolve(JSONdata);
            }
            catch (err) {
                reject(err);
            }
        });

    }
    function Go()
    {
        $ = jQuery;

        if (!document.location.href.startsWith("https://www.netflix.com/viewingactivity")) {
            alert("This sync script must be injected into the the netflix activity page.");
            throw ("This sync script must be injected into the the netflix activity page.");
        }
        DoTraktAuth();
        ShowLoader();

        var watched = GetWatched();
        var Watched;
        var History;
        fetchMovies(watched).then(function(res){
            Watched = res;
            GetHistory().then(function(histo){
                History = histo;
                CompareHistory(Watched, histo).then(function(data) {BuildSync(data).then(function(data){
                    //MakeJson(data);
                    //console.log(data);
                    SyncToTrakt(data);
                });});
            });

        });
    }

    function SyncToTrakt(data)
    {
        console.log(data);
        $.post("https://api.trakt.tv/sync/history", JSON.stringify(data), function(data) {
            console.log(data);
            HideLoader();
            //$(".trakt-dialog .trakt-sync-results").show();
            $.notify('Synced Episodes: ' + data.added.episodes,'success');
            $.notify('Synced Movies: ' + data.added.movies,'success');
            if (data.not_found.episodes.length)
            $.notify('Not Synced Episodes: ' + data.not_found.episodes.length,'error');
            if (data.not_found.movies.length)
            $.notify('Not Synced Movies: ' + data.not_found.movies.length,'error');

            console.log('Synced Episodes: ' + data.added.episodes);
            console.log('Synced Movies: ' + data.added.movies);
            console.log('Not Synced Episodes: ' + data.not_found.episodes.length);
            console.log('Not Synced Movies: ' + data.not_found.movies.length);
        });
    }

    function BuildSync(data)
    {
        return new Promise(function(resolve,reject){
            var SyncBody = {
                episodes : [],
                movies : []
            };
            data.forEach(function(dat){
                if (dat.type == 'episode')
                {
                    var epi = {};
                    epi.title = dat.title;
                    epi.ids = dat.ids;
                    epi.watched_at = dat.watched;
                    SyncBody.episodes.push(epi);
                }
                if (dat.type == 'movie')
                {
                    var mov = {};
                    mov.title = dat.title;
                    mov.watched_at = dat.watched;
                    mov.ids = dat.ids;
                    SyncBody.movies.push(mov);
                }
            });
            resolve(SyncBody);
        });
    }

    function CompareHistory(watched, history)
    {
        return new Promise(function (resolve, reject) {
            var ToSync = [];
            var TotalEpis=0;
            watched.Shows.forEach(function(show){
                show.episodes.forEach(function(episode){
                    TotalEpis++;
                    console.log(episode);
                    var test =  _.find(history, function(obj) {
                        if (obj.action != 'scrobble')
                        {
                            if (obj.type == 'episode')
                            {
                                if  (obj.episode.title == episode.title)
                                {
                                    if (compareDate(episode.watched, obj.watched_at))
                                    {
                                        return obj;
                                    }
                                }
                            }
                        }
                    });
                    if (test === undefined)
                    {
                        ToSync.push(episode);
                    }
                });
            });
            watched.Movies.forEach(function(movie){
                var movtest =  _.find(history, function(obj) {
                    if (obj.action != 'scrobble')
                    {
                        if (obj.type == 'movie')
                        {
                            if  (obj.movie.title == movie.title)
                            {
                                if (compareDate(movie.watched, obj.watched_at))
                                {
                                    return obj;
                                }
                            }
                        }
                    }
                });
                var test = movtest;
                if (movtest === undefined)
                {
                    ToSync.push(movie);
                }
            });

            //console.log(ToSync);
            //console.log(TotalEpis);
            //MakeJson(ToSync);
            resolve(ToSync);
        });
    }

    function OnlyDate(date)
    {
        var d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function compareDate(date1, date2)
    {
        var epidate = OnlyDate(date1).toISOString();
        var histodate =  OnlyDate(date2).toISOString();
        if (epidate == histodate)
        {
            //console.log(epidate + ' equals ' + histodate);
            return true;
        }
        else
        {
            //console.log(epidate + ' does not equals ' + histodate);
            return false;
        }
    }

    function GetHistory()
    {
        var request = $.get('https://api.trakt.tv/sync/history?limit=10000');
        return request;
    }

    function GetWatched()
    {
        // Load the list of watched shows from netflix.
        var watched = $(".retableRow").map(function () {
            var date = $(".date", this).text();
            var text = $(".title", this).text();
            text = text.replace(": Part ", " - Part ");
            if (text.indexOf("Mystery Science Theater 3000: The Return: Season ") !== false)
                text = text.replace(": The Return: Season ", ": Season 1");

            var [show, season, title] = text.split(/: Season |: Series |: Collection |: "/);
            var isShow = !title ? false : true;
            title = isShow ? title.replace(/^(.*)"$/, "$1") : $(".title", this).text();
            season = parseInt(season);
            if (text.startsWith('Penn & Teller'))
            { season = 0; }

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

    function fetchMovies(watched)
    {
        return new Promise(function (resolve, reject) {
            var promises = [];
            var data = {
                viewhistory: new Date().toLocaleString(),
                Shows: [],
                Movies: []
            };
            watched.each(function () {
                var item = this;
                if (!isNaN(item.season)) {
                    promises.push(GetEpisode(item)); // push the Promises to our array
                }
                else
                {
                    promises.push(GetMovie(item)); // push the Promises to our array
                }
            });

            Promise.all(promises).then(function (res) {
                //console.log(res);
                res.forEach(function (result) {
                    //console.log(result);
                    var Show;
                    if (result !== undefined) {
                        if (result.type == 'Show')
                        {
                            try {
                                Show = _.find(data.Shows, function (obj) {
                                    return obj.showid == result.showid;
                                });
                                //console.log(epi);
                                Show.episodes.push(result.episodes[0]);
                            }
                            catch (err) {
                                //console.log(err);
                            }
                            //console.log(epi);
                            if (Show === undefined) {
                                data.Shows.push(result);
                            }
                        }
                        else
                        {
                            try
                            {
                                var mov = result.movie;
                                if (mov !== undefined)
                                {
                                    data.Movies.push(mov);
                                }
                            }
                            catch(err)
                            {

                            }
                        }
                    }
                });

                console.log(data);
                //return data;
                resolve(data);
            }).catch(function (err) {
                console.log(err);
            });
        });
    }

    function GetMovie(item)
    {
        return new Promise(function (resolve, reject) {
            var settings = {
                async: true,
                dataType: "json",
                contentType: "application/json",
                headers: {
                    "Authorization": "Bearer " + document.cookie.replace(/^.*access_token=([^;]+).*$/, "$1"),
                    "trakt-api-version": 2,
                    "trakt-api-key": "234507383f34b4a91d740f947f799cfa899623787ec7115291298a285fab0a8b"
                }};
            $.ajax( $.extend( settings, {"url":'https://api.trakt.tv/search/movie?query=' + item.title} ) ).done(function(res) {
                if (res && res.length)
                {
                    //console.log(res);
                    var mov = res[0];
                    mov.movie.type = 'movie';
                    mov.movie.watched = item.date;
                    //console.log(mov);
                    resolve(mov);
                }
                else
                {
                    resolve();
                }
            });

        });
    }

    function DoTraktAuth()
    {
        // Get authentication status.
        var has_access_token = document.cookie.search(/access_token/) >= 0;
        var has_refresh_token = document.cookie.search(/refresh_token/) >= 0;
        var has_code = window.location.search.search((/code=[^&]+/)) >= 0;


        // Prompt for trakt.tv login.
        if (!has_access_token && !has_refresh_token && !has_code)
            window.location = "https://trakt.tv/oauth/authorize?response_type=code&client_id=234507383f34b4a91d740f947f799cfa899623787ec7115291298a285fab0a8b&redirect_uri=https%3A%2F%2Fwww.netflix.com%2Fviewingactivity";

        // Run the tool.
        else if (has_access_token) {
            //finalizeAuth();
        } else if (has_refresh_token || has_code) {
            // Re-authenticate with trakt.tv.
            if (has_refresh_token)
                var body = {
                    'refresh_token': document.cookie.replace(/^.*refresh_token=([^;]+).*$/, "$1"),
                    'client_id': '234507383f34b4a91d740f947f799cfa899623787ec7115291298a285fab0a8b',
                    'client_secret': '00f363650b9b1e3523ad66fe8e5728a7b733a365e4929c4015a39abcfe3d15bf',
                    'redirect_uri': 'https://www.netflix.com/viewingactivity',
                    'grant_type': 'refresh_token'
                };
            // Get access token from trakt.tv.
            else if (has_code)
                var body = {
                    'code': window.location.search.replace(/^.*code=([^&]+).*$/, "$1"),
                    'client_id': '234507383f34b4a91d740f947f799cfa899623787ec7115291298a285fab0a8b',
                    'client_secret': '00f363650b9b1e3523ad66fe8e5728a7b733a365e4929c4015a39abcfe3d15bf',
                    'redirect_uri': 'https://www.netflix.com/viewingactivity',
                    'grant_type': 'authorization_code'
                };

            $.post("https://api.trakt.tv/oauth/token", body, function (data) {
                console.log("Sucessfully Authenticated");
                //access_token, token_type, expires_in, refresh_token, scope, created_at
                document.cookie = "access_token=" + data.access_token + "; expires=" + new Date((data.created_at + data.expires_in) * 1000).toUTCString();
                document.cookie = "refresh_token=" + data.refresh_token + "; expires=" + new Date((data.created_at + (data.expires_in * 4)) * 1000).toUTCString();
            });
        } else
            alert("Unexpected error authenticating.");
        var Bearer = document.cookie.replace(/^.*access_token=([^;]+).*$/, "$1");
        console.log(Bearer);
        $.ajaxSetup({
            async: true,
            dataType: "json",
            contentType: "application/json",
            headers: {
                "Authorization": "Bearer " + Bearer,
                "trakt-api-version": 2,
                "trakt-api-key": "c14f3c7ac7b41e9f45cb07b4d314b454647c36365d32d151cf8193e5ff3b2fd8"
            }
        });
    }

    function GetEpisode(item)
    {
        return new Promise(function (resolve, reject) {
            //var test = $.get('https://api.tvmaze.com/singlesearch/shows?q=' + item.show + '&embed=episodes');
            var array = item.title.split(':').pop();
            var eptitle = array;
            var settings = {
                async: true,
                dataType: "json",
                contentType: "application/json",
                headers: {
                    "Authorization": "Bearer " + document.cookie.replace(/^.*access_token=([^;]+).*$/, "$1"),
                    "trakt-api-version": 2,
                    "trakt-api-key": "234507383f34b4a91d740f947f799cfa899623787ec7115291298a285fab0a8b"
                }};
            var test = $.ajax( $.extend( settings, {"url":'https://api.trakt.tv/search/episode?query=' + eptitle} ) );
            test.done(function (result) {
                var mkep;
                if (result.length > 0)
                {
                    result.forEach(function(res){
                        //console.log(res.show.title);
                        if (res.show.title == item.show)
                        {
                            //console.log(res.show.title);
                            var ep = res.episode;
                            var sh = res.show;

                            mkep = MakeEpisode(item, ep, res.show);


                        }
                    });
                    if (mkep !== undefined)
                    {
                        resolve(mkep);
                    }
                    else
                    {
                        resolve();
                    }
                }
                else
                {
                    resolve();
                }
            });
            test.error(function (err) {
                resolve();
            });
        });

    }

    function MakeEpisode(item, ep, sh)
    {
        var Show = {};
        if (ep !== undefined) {
            Show.type = 'Show';
            Show.showid = sh.ids.trakt;
            Show.name = sh.title;
            Show.episodes = [ep];
            Show.episodes[0].type = 'episode';
            Show.episodes[0].watched = item.date;
            //data.episodes.push(episode);
            //episode);
        }
        return Show;
    }

    function download(text, name, type)
    {
        var a = document.createElement("a");
        var file = new Blob([text], { type: type });
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
    }

    function decode_date(date_str)
    {
        var [day, month, year] = date_str.split("/");
        year = parseInt(year) > parseInt(new Date().getFullYear().toString().substring(2)) ? year : "20" + year;
        return new Date(year, month - 1, day);
    }

    function insertAfter(newNode, referenceNode)
    {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function sleep(miliseconds)
    {
        var currentTime = new Date().getTime();

        while (currentTime + miliseconds >= new Date().getTime()) {
        }
    }

    function Wait(Message)
    {
        console.log(Message);
    }


}) ();
