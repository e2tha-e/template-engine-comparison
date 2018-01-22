# About Feplet

### Why another Mustache-compatible templating language?

This project arose from the needs of 
<a href="http://fepper.io" target="blank">Fepper</a> and its implementation of 
Pattern Lab. Fepper requires the simplicity of Mustache (and not the complexity 
of Handlebars), the flexible tag-to-data matching of Mustache (and not the rigid 
tag-to-data nesting hierarchy of Handlebars), and the speed of Mustache 
(specifically the Hogan.js library) when compiling large template sets.

### Why functional programming?

There needs to be a clear direction on how Feplet is implemented. Feplet needs 
to accomplish these tasks (at a minimum):

* Precompile partials with data parameters distinctly from those without.
* On each precompilation, hydrate partials only with data passed as parameters.
* On each precompilation, leave tags that are not targeted by data parameters 
  unrendered.
* On each template compilation, recursively include the precompiled partials to 
  an indefinite depth.
* Render the compiled template according to Mustache's flexible tag-to-data 
  matching scheme.

The overarching task at hand is recursing through nested, branching, fractal 
structures.

### Object-oriented programming?

Feplet is only minimally object-oriented. Any class it inherits is from an 
underlying library, and is abstracted away from users.

### Procedural programming?

Would it make sense to emulate inexperienced programmers (or even experienced 
COBOL programmers) and just program procedurally? Let's just leave that as a 
rhetorical question.

We've all heard developers evangelize their way of doing things because of a 
performance gain of literally milliseconds. But when compiling megabtyes of 
templates, performance actually matters to people with other things to do. The 
choice of templating engine can yield performance gains (or losses) of minutes 
per build.

### How is this functional programming?

Besides extensively using recursion, we don't concern ourselves with 
side-effects or state. We instead concern ourselves with submitting input into 
functions, and receiving output from them. We don't mutate or do horrible things 
to data. Data structures are generally treated as stacks. They are added to, but 
the older parts are never changed. They are certainly never knocked down and 
substituted with a different stack, the public none-the-wiser that the original 
stack is buried somewhere never to be seen again.

### Where does the name come from?

Feplet is the spelled-out sound of a contraction of "Fepper template." (Fepper 
is a contraction of "front end prototyper.") It could also be the diminutive of 
"Fepper." It is very much the engine that drives Fepper.
