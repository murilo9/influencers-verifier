import { Box, List, ListItem, ListItemText, Typography } from "@mui/material";

export default function AboutPage() {
  return (
    <Box
      sx={{ h5: { my: 3 }, h6: { my: 2 }, ".MuiTypography-body1": { mb: 1 } }}
    >
      <Typography variant="h5">Infleuncer Checker - About</Typography>
      <Typography variant="h6">What is this project</Typography>
      <Typography>
        This is a prototype of an influencer checker app that lists health
        claims made by health influencers and verificates them against trusted
        sources. The Influencers page lists all registered influencers, the
        themes they talk about (nutrition, mental health, fitness, etc), the
        health claims they made and their trust score in the platform.
      </Typography>
      <Typography>
        The Claims page lists all the claims extracted from influencers' social
        profiles, their respective statuses (supported, debunked, questionable
        or unknown), trust scores and articles found related to their subject.
        By expanding an item in the claims list you ca see which influencers
        have made that claim and the original context (i.e. the post in their
        social network).
      </Typography>
      <Typography>
        There is also an Admin Panel where influencers and claims can be managed
        (inserted/removed).
      </Typography>
      <Typography variant="h6">How does it work?</Typography>
      <Typography>
        The app is essentially based upon two things: influencers and claims.
        Once an influencer is registered in the app, their social profiles
        (instagram, facebook, linkedin, etc) are fetched. From their social
        profiles' posts, health claims are extracted. Then for each claim, the
        app tries to find scientific articles related to the claim's sibject,
        and checks whether the article supports, negates or is inconclusive
        about the claim. From that, a score (from -10 to 10) is given to the
        claim.
      </Typography>
      <Typography variant="h6">What technologies were used?</Typography>
      <List
        sx={{
          ".MuiSvgIcon-root": { fontSize: "12px" },
          ".MuiListItem-root": { p: 0 },
        }}
      >
        <ListItem>
          <ListItemText>
            - The frontend is made with React and Material UI, deployed on
            Netlify.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - The backend is a REST API implemented with Nest.js, with some
            flows resembling an event-driven architecture.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - The data is stored in a MongoDB database.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - For fetching influencers' social profiles and posts, I'm using{" "}
            <a href="https://apify.com/" target="_blank">
              Apify
            </a>
            .
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - For extracting claims from posts and validating them with
            articles, I'm using ChatGPT, through OpeanAI API.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - For searching for scientific articles, I'm using{" "}
            <a
              href="https://pmc.ncbi.nlm.nih.gov/tools/developers/"
              target="_blank"
            >
              NCBI's APIs
            </a>
            .
          </ListItemText>
        </ListItem>
      </List>
      <Typography variant="h6">Limitations</Typography>
      <Typography>
        Even though this is a functional prototype, it has some limitations that
        came from both the time constraint and from the nature of the tools
        used.
      </Typography>
      <List sx={{ ".MuiListItem-root": { p: 0 } }}>
        <ListItem>
          <ListItemText>
            - For now, only posts from Instagram are fetched. Other social
            networks can be including by looking deeper at Apify's marketplace.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - The only scientific databse where articles are fetched from is
            PubMed. It would be interesting to include other databases (such as{" "}
            <a href="https://www.ncbi.nlm.nih.gov/mesh/">MeSH</a>,{" "}
            <a href="https://www.ncbi.nlm.nih.gov/nlmcatalog/">NLM</a> and{" "}
            <a href="https://www.ncbi.nlm.nih.gov/books/">Bookshelf</a>).
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - ChatGPT's ability to scrap health claims from posts is not 100%
            accurate, as sometimes it may extract non-health-related claims,
            which can be manually removed through the Admin Panel. By the other
            hand, is showed great skill on telling whether an article is related
            to a claim's subject, as well as to check if an article supports,
            negates or is inconclusive for a health claim.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - Some tasks, such as fetching scientific articles and verifying
            claims against them are naturally time-consuming, so finishing an
            influencer's registration process is done asynchronously, and it
            usually takes more than a minute.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - There are time-based limits for making requests to NCBI's API,
            which contributes to the long time of verifying claims.
          </ListItemText>
        </ListItem>
      </List>
      <Typography variant="h6">How does it work: detailed</Typography>
      <List sx={{ ".MuiListItem-root": { p: 0 } }}>
        <ListItem>
          <ListItemText>
            - From the Admin Panel, you can add the name of an influencer you
            want to register.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - From the influencer's name, the Apify module fetches their social
            profiles.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - From the influencer's social profiles, the Apify module fetches
            their posts.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - For each post, the app asks ChatGPT to scrap for health claims
            contained on them, and their respective subjects (nutrition, health
            conditions, fitness, mental health, etc).
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - For each claim, the app builds several different queries in order
            to fetch scientific articles related to them, using NCBI's API.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - The list of related articles is then compared agains the claims:
            the app asks ChatGPT to find out if the articles are actually
            related to the claim's subject, and whether they support, negate or
            are inconclusive about the claim.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - From the analysis above, a score is calculated for the claim, as
            well as for the influencer.
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            - The influencer's data, as well as the claims can then be displayed
            in the app.
          </ListItemText>
        </ListItem>
      </List>
    </Box>
  );
}
