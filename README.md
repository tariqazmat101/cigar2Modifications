# Hi Takis, 
If you would like to commit something, please feel free to do so in the masterbranch 

If you are working on a feature, or maybe just playing around and don't want to pollute the masterbranch, you can fork the masterbranch and rename it as a feature 
branch. see this for more information:
https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow#:~:text=The%20Feature%20Branch%20Workflow%20assumes,work%20on%20a%20new%20feature.
take care

Within this repository, you will find 3 branches:
1. the replayer branch 
2. the replay branch
3. the masterbranch 

### The Replayer Branch 
This branch contains code that allows the client to record 10 seconds of gameplay. Once a user clicks the 'r' key, the client immediately outputs a textfile of server instructions. 

### The Replay Branch 
Once you have the textfile from the Replayer branch, you feed it into this branch to see realtime playback of your game. 

**Both of these branches are work in progress, but you are free to try to them out** 

### The MasterBranch 

self-explanatory 

I will work on this stuff when I have time, its mostly for fun, I'm not doing it for anyone but myself. 
updated july 3rd 2019, I have added a ci/cd pipeline, any commit to maserbranch will automatically deployed to the site. This is a very very cool functionality :) 
It costs me $1/month to use the pipeline, but it's worth it. I especially love how easy it was to set up, it only took my <10 minutes for a such a powerful tool. Granted, this is a propietary tool from AWS that I am using, there are a plethora of open source technoglogies that offer the same functionality and are free. Also, i should really get into the habit of learning about ci/cd pipelines, its the bread and butter for a dev ops engineer. 

I hope you are havomg as much fun with databases/distributed stuff like Apache Spark as I am with cloud computing,docker,nginx,revese proxies. 
