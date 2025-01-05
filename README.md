Searching articles from NCBI:
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=covid%20vaccine

Given an article ID, fetches its metadata:
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=33248227

Then collect the abstract.

If the influencer is registered, retrieves their profile with claims list.
If the influencer is not registered, register them and fetches their social posts.
From the social posts, find which ones are health claims.
For each health claim,find out which ones are unique (among the database) and uniquefy the ones that were not uniquefied yet.

The biggest challenge is to detect duplicated claims. The larger the claims list, the longer it takes to work that out. Ideally, that should be done in batches. Hashing does not solve that because slightly different words in equivalent normalized claims already generate different hashes.

Steps for verifying a claim:

- Build the article fetching query (subject, action, target)
- Use the query to fetch related articles
- For each related article, use the abstract to check if it 1) supports/contradicts the claim or is inconclusive/irrelevant and 2) the strength level of the support/contradiction.
- Based on the previous check, get a claim "score", where -1 to 0 is debunked, 0 to 0.4 is questionable, > 0.4 is supported, and null is unsupported. The amount of articles enhances the final score.
- Based on the claims' scores, calculate the influencer score.

Limitations:

- for now, the articles search only retrieves the frist 20 results.
- in order to avoid 429 errors, I have to wait at least 4 seconds between every request.
