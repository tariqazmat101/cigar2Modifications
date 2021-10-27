Semi-producton grade version of Cigar2 

It comes with 
*Webpack intregration (mostly for bundling and obfuscating) 
*90% finished replay recorder
*Refactor of the original cigar2 to make it more modular

The idea was to rewrite cigar2 to make it production grade, and that entailed refactoring the entire codebase, seperating out it's  major compondents(gameserver,minimap,cell, binaryreader, etc) into their own respective files, integrating webpack support, amd adding features such as the Replay feature. However, I stopped working 80% into the project as I got bored of blob games. 

Why did I work on this? 
Well, I wanted to make my own blob game at one point, but soon came to the reality that it wouldn't be succesful. At this point, I figured it would still be a great learning project and I certainly did learn alot! (Working with Docker,Typescript, Pub/sub design patterns, Webpack, Configring reverse proxies, and so much more) BUT I wanted to close the blob game chapter in my life - which meant quitting this project. 
