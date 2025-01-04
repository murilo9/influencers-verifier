Searching articles from NCBI:
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=covid%20vaccine

Given an article ID, fetches its metadata:
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=33248227

Then collect the abstract.

If the influencer is registered, retrieves their profile with claims list.
If the influencer is not registered, register them and fetches their social posts.
From the social posts, find which ones are health claims.
For each health claim,find out which ones are unique (among the database) and uniquefy the ones that were not uniquefied yet.

The biggest challenge is to detect duplicated claims. The larger the claims list, the longer it takes to work that out. Ideally, that should be done in batches. Hashing does not solve that because slightly different words in equivalent normalized claims already generate different hashes.
