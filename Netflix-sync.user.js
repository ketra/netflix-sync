// ==UserScript==
// @name         netflix-sync
// @namespace    https://github.com/ketra/netflix-sync
// @version      0.7
// @description  Script to sync Netflix history to Trakt
// @author       Ketra
// @match        https://www.netflix.com/viewingactivity*
// @updateURL    https://github.com/ketra/netflix-sync/raw/master/Netflix-sync.user.js
// @downloadURL  https://github.com/ketra/netflix-sync/raw/master/Netflix-sync.user.js
// ==/UserScript==

(function() {
    'use strict';

    var header = document.getElementById('hd');
    var element = document.querySelector("li[data-reactid='20']");
    var btn = document.createElement("li");
    var t = document.createTextNode("Sync");
    btn.appendChild(t);
    insertAfter(btn,element);

    btn.addEventListener("click", function() {
        load('https://cdn.rawgit.com/ketra/netflix-sync/master/jquery-ui.js', 'js');
        load('https://cdn.rawgit.com/ketra/netflix-sync/master/netflix-sync.js','js');
        load('https://cdn.rawgit.com/ketra/netflix-sync/master/netflix-sync.css','css');
    }, false);

    function load(filename, type){
        var fileref=document.createElement('script');
        if(type=='js'){
            fileref=document.createElement('script');
            fileref.setAttribute('type','text/javascript');
            fileref.setAttribute('src',filename);
        }
        else if (type=='css'){
            fileref=document.createElement('link');
            fileref.setAttribute('rel','stylesheet');
            fileref.setAttribute('type','text/css');
            fileref.setAttribute('href',filename);
        }
        document.getElementsByTagName('head')[0].appendChild(fileref);
    }

    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }


})();
