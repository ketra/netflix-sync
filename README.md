# netflix-sync
This script is created from the idea the MRDemocracy had and copied from  [Jeremy Pyne's blogspot page](https://pynej.blogspot.com/2017/07/netflix-to-trakttv-sync.html)

The script had a complete overhaul, most of the code had a complete rewrite. now we have 2 parts. 

1 Drag this link, <strong><a href="javascript:function load(filename){
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
load('https://code.jquery.com/ui/1.12.1/jquery-ui.js', 'js');
load('https://www.inkonit.com/netflix/netflix-sync.js','js');
load('https://www.inkonit.com/netflix/netflix-sync.css','css');">synt to trakt</a>
</strong> 
 2 or install [TamperMonkey](https://tampermonkey.net/) and import [Script](https://github.com/ketra/netflix-sync/raw/master/Netflix-sync.user.js) this will auto update itself when there is a new function (recomended).
 
 for bugs please report and issue here.
