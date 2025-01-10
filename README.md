# Influencer Checker

### What is this project?

This is a prototype of an influencer checker app that lists health claims made by health influencers and verificates them against trusted sources.
The Influencers page lists all registered influencers, the themes they talk about (nutrition, mental health, fitness, etc), the health claims they made and their trust score in the platform.
The Claims page lists all the claims extracted from influencers' social profiles, their respective statuses (supported, debunked, questionable or unknown), trust scores and articles found related to their subject. By expanding an item in the claims list you ca see which influencers have made that claim and the original context (i.e. the post in their social network).
There is also an Admin Panel where influencers and claims can be managed (inserted/removed).

### How does it work?

The app is essentially based upon two things: influencers and claims. Once an influencer is registered in the app, their social profiles (instagram, facebook, linkedin, etc) are fetched. From their social profiles' posts, health claims are extracted. Then for each claim, the app tries to find scientific articles related to the claim's sibject, and checks whether the article supports, negates or is inconclusive about the claim. From that, a score (from -10 to 10) is given to the claim.

### What technologies were used?

- The frontend is made with React and Material UI, deployed on Netlify.
- The backend is a REST API implemented with Nest.js, with some flows resembling an event-driven architecture.
- The data is stored in a MongoDB database.
- For fetching influencers' social profiles and posts, I'm using [Apify](https://apify.com/).
- For extracting claims from posts and validating them with articles, I'm using ChatGPT, through OpeanAI API.
- For searching for scientific articles, I'm using [NCBI's APIs](https://pmc.ncbi.nlm.nih.gov/tools/developers/).

### Limitations

Even though this is a functional prototype, it has some limitations that came from both the time constraint and from the nature of the tools used.

- For now, only posts from Instagram are fetched. Other social networks can be including by looking deeper at Apify's marketplace.
- The only scientific databse where articles are fetched from is PubMed. It would be interesting to include other databases (such as [MeSH](https://www.ncbi.nlm.nih.gov/mesh/), [NLM](https://www.ncbi.nlm.nih.gov/nlmcatalog/) and [Bookshelf](https://www.ncbi.nlm.nih.gov/books/)).
- ChatGPT's ability to scrap health claims from posts is not 100% accurate, as sometimes it may extract non-health-related claims, which can be manually removed through the Admin Panel. By the other hand, is showed great skill on telling whether an article is related to a claim's subject, as well as to check if an article supports, negates or is inconclusive for a health claim.
- Some tasks, such as fetching scientific articles and verifying claims against them are naturally time-consuming, so finishing an influencer's registration process is done asynchronously, and it usually takes more than a minute.
- There are time-based limits for making requests to NCBI's API, which contributes to the long time of verifying claims.

### How does it work: detailed

1. From the Admin Panel, you can add the name of an influencer you want to register.
2. From the influencer's name, the Apify module fetches their social profiles.
3. From the influencer's social profiles, the Apify module fetches their posts.
4. For each post, the app asks ChatGPT to scrap for health claims contained on them, and their respective subjects (nutrition, health conditions, fitness, mental health, etc).
5. For each claim, the app builds several different queries in order to fetch scientific articles related to them, using NCBI's API.
6. The list of related articles is then compared agains the claims: the app asks ChatGPT to find out if the articles are actually related to the claim's subject, and whether they support, negate or are inconclusive about the claim.
7. From the analysis above, a score is calculated for the claim, as well as for the influencer.
8. The influencer's data, as well as the claims can then be displayed in the app.
