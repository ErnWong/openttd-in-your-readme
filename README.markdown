# Can we run OpenTTD in our GitHub Readmes?

**Spoilers: the answer is no :(**

There's quite some hype for setting up your own unique GitHub readme these days.

In the earlier days of computing, people were excited about the advancements to computer graphics and they were more than eager to show them off by adding flashing animations, 3D effects, bevels, skeuomorphism, and colourful gradients to everything they touch. As users got accustomed to these effects, we started to cut away these unnecessary visual fluffs and focused on what really mattered - the content.

When developers realised that they could make their profile page animated, it feels like we couldn't resist going back to our old mindset and show off how unique their profile page could be. In fact, people started adding animations, adding badges that automatically update, and even tabletop games! Sure, why not. Let's have some fun with our readme's too before it gets old (if it ever gets old).

*How far can we go?*

*How about adding a 3D real-time game to your readme, like, I don't know, OpenTTD?*

## The Disappointment

Problem: GitHub proxies all external images (for a [good reason](https://github.blog/2010-11-13-sidejack-prevention-phase-3-ssl-proxied-assets/)), and GitHub's image proxy server (camo) does not seem to like to proxy an infinitely long GIF file (*probably* for a very good reason).

## How it (was supposed to) work(s)

Okay, hear me out.  
We have OpenTTD running,  
And a VNC (Virtual Network Computing) server running,  
Inside Ubuntu,  
Inside a Docker container,  
And in another Docker container,  
There is an Express server,  
That connects to the OpenTTD container's VNC using RFB (Remote Frame Buffer),  
And creates an endpoint that generates a GIF (pronounced Ghee-Eye-Effffff) image,  
Such that,  
When a browser requests a GIF (Ghee-Eye-Effffff) image,  
The Express server starts encoding the RFB video data into GIF frames,  
And streams these GIF frames (along with an initial header) back to the browser.  
But what about the keyboard and mouse inputs?  
What a good question!  
The answer is:  
More endpoints!  
The README will have links (disguised as ugly button-like images)  
That mimic the look of a keyboard, mouse, and a weird-as cursor positioning control  
And these links redirect the browser page to the endpoint  
Which the Express server handles,  
And sends the appropriate input events through the RFB connection,  
Before sending an HTTP response telling the browser  
To go back to the previous page (i.e. the README page).
