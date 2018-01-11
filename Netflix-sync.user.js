// ==UserScript==
// @name         netflix-sync
// @namespace    https://gist.github.com/ketra/a734fde4da38c879e3a79b1d54c78114
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.netflix.com/viewingactivity*
// @updateURL    https://gist.github.com/ketra/a734fde4da38c879e3a79b1d54c78114
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var header = document.getElementById('hd');
    var element = document.querySelector("li[data-reactid='20']");
    var btn = document.createElement("li");
    var t = document.createTextNode("Sync");
    btn.className = "profile-selector";
    btn.appendChild(t);
    insertAfter(btn,element);

    btn.addEventListener("click", function() {
        load('https://raw.githubusercontent.com/ketra/netflix-sync/master/jquery-ui.js', 'js');
        load('https://raw.githubusercontent.com/ketra/netflix-sync/master/netflix-sync.js','js');
        load('https://raw.githubusercontent.com/ketra/netflix-sync/master/netflix-sync.css','css');
    }, false);

    function load(filename){
        if(filename.endsWith('.js')){
            var fileref=document.createElement('script');
            fileref.setAttribute('type','text/javascript');
            fileref.setAttribute('src',filename);
        }
        else if (filename.endsWith('.css')){
            var fileref=document.createElement('link');
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
