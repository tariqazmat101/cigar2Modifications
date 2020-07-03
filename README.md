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

updated july 3rd 2019, I have added a ci/cd pipeline. Any commit to maserbranch will automatically be deployed to the site, cool huh? :) 
It costs me $1/month to use the pipeline, but it's worth it. I love how easy it is to set up, it only took my <10 minutes!  

(here)(https://medium.com/avmconsulting-blog/automate-static-website-deployment-from-github-to-s3-using-aws-codepipeline-16acca25ebc1#:~:text=Automate%20static%20website%20deployment%20from%20Github%20to%20S3%20using%20AWS%20CodePipeline,-Sithum%20Jayarathna&text=Automatically%20deploy%20changes%20made%20to,git%20repository%20to%20make%20changes.) is the tutorial that I followed. 
Also, check this out Takis, (here)(https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc) why are you paying for a server when AWS offers a free tier for servers? :)  This is perfect for hosting. 

I hope you are havomg as much fun with databases/distributed stuff like Apache Spark as I am with cloud computing,docker,nginx,revese proxies,etc 
happy coding 
