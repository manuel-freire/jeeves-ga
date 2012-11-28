jeeves-ga
=========

Simple genetic algorithms that run client-side using standards-conforming JS. 
Optional user-friendly UI, results and progress plotting with jQuery UI and protovis. 

### Optional requirements ###

##### (Web) User Interface

jQuery, jQuery UI and Protovis (included in the repository, in somewhat outdated versions)

- [jQuery](http://jquery.org/) and [jQuery-UI](http://jqueryui.com/) are licensed under the [MIT license](https://github.com/jquery/jquery-ui/blob/master/MIT-LICENSE.txt) 
- [ProtoVis](http://mbostock.github.com/protovis/) is provided under the [BSD License](http://opensource.org/licenses/bsd-license.php). I should really rewrite this code to use [D3](http://d3js.org/) instead...

##### Compilation, Editing and Documentation

the [Closure Compiler](http://code.google.com/p/closure-compiler/) is used in the [Ant](ant.apache.org/) build-file (`build.xml`). To get the build-file to work, you will need to place the Closure Compiler's `compiler.jar` in the `ext/` folder (which is not managed by git, and is included in the `.gitignore` file).

[Js-Doc](http://code.google.com/p/jsdoc-toolkit/) is used throughout in JS comments. The ant buid-file expects to find it at `/ext/jsdoc-toolkit/jsrun.jar`.

I am a fan of [NetBeans](http://netbeans.org/); the `nbproject/` folder contains 
the project information that NetBeans uses to integrate with the Ant build-file.


### Examples ###

Three examples are provided in the web folder; open `web/demo/index.html` in a browser to see them. They require a `web/lib/jeeves-1.0.js` file to work; you can either create this file using the ant build-file, or build it by concatenating together everything in the `src/` folder, in the order `jeeves.js`, `jeeves-util.js`, `jeeves-log.js`, `jeeves-ui.js`.

### Author & License ###

You can contact the author at manuel.freire@gmail.com.

This software is licensed under the [GNU LGPL] (http://www.gnu.org/copyleft/lesser.html) v3 or later


