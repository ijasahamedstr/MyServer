import express from 'express';
import connectDB from "./lib/db.js";
import cors from "cors";
import cookiParser from "cookie-parser";
import Accountrouter from './routes/AccountRegister.route.js';
import soicalrouter from './routes/soicalAccount.route.js';
import gamerouter from './routes/gameaccount.route.js';
import AccountActiverouter from './routes/AccountActive.route.js';
import verifyrouter from './routes/Accountverify.route.js';
import servicerouter from "./routes/service.route.js";
import pointrouter from "./routes/Point.Routes.js";
import feedbackrouter from "./routes/feedback.route.js";
import adminfeedbackrouter from "./routes/adminfeedback.route.js";
import Accountboostrouter from "./routes/Accountboost.route.js";
import notificationrouter from "./routes/notification.route.js";
import bankrouter from "./routes/bank.route.js";
import servicerequestrouter from "./routes/servicerequest.routes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import logoutrouter from "./routes/Logout.route.js";
import loginrouter from "./routes/Login.route.js";
import validuserrouter from "./routes/ValidUser.route.js";
import userrouter from "./routes/userAuthRoutes.js";
import userotprouters from './routes/UserOtp.route.js';
import { TwitterApi } from 'twitter-api-v2';




// Create an instance of Express
const app = express();

app.use(cookiParser());

// Connect DB

connectDB();

// Define a route handler for the default home page
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(cors({
  origin:"https://soicalbuyer-omega.vercel.app",
  methods:"GET,POST,PUT,DELETE",
  credentials:true
}));


//Data understanding middleware
app.use(express.json());

//Validate your Data
app.use(express.urlencoded({extended:true}))

// User Account Create
app.use('/register',Accountrouter);

app.use('/soical',soicalrouter);

app.use('/gameaccount',gamerouter);

// Account Active 
app.use('/Accountactive',AccountActiverouter);

// User Account verify
app.use('/verify',verifyrouter);

app.use('/service',servicerouter);

app.use('/point',pointrouter);

app.use('/feedback',feedbackrouter);

app.use('/adminfeedback', adminfeedbackrouter);

app.use('/boost',Accountboostrouter);

app.use('/notification',notificationrouter);

app.use('/bank',bankrouter);

app.use('/servicerequest',servicerequestrouter);

app.use('/login',loginrouter);

app.use('/validuser',validuserrouter);

app.use('/logout',logoutrouter);

app.use('/userotp',userotprouters);


// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/useruploads', express.static(path.join(__dirname, 'useruploads')));
app.use('/uploads/AccountActive', express.static(path.join(__dirname, 'uploads/AccountActive')));
app.use('/Accountimage', express.static(path.join(__dirname, 'Accountimage')));

app.use("/user/api",userrouter);



/*************************************************************** */
const {
  TWITTER_API_KEY,
  TWITTER_API_SECRET_KEY,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET
} = process.env;

if (!TWITTER_API_KEY || !TWITTER_API_SECRET_KEY || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
  console.error('Missing Twitter API credentials. Please check your .env file.');
  process.exit(1);
}

const twitterClient = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET_KEY,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
});

app.use(express.json());

let cacheTimestamp = Date.now();

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

app.get('/api/twitter-info/:username', async (req, res) => {
  const { username } = req.params; 
  if (userCache[username] && (Date.now() - cacheTimestamp < CACHE_DURATION_MS)) {
    return res.json(userCache[username]);
  }

  try {
    const user = await twitterClient.v2.userByUsername(username, {
      'user.fields': 'description', // Specify that we want the description field
    });

    if (!user.data) {
      return res.status(404).json({ error: 'User not found' });
    }

    userCache[username] = {
      username: user.data.username,
      name: user.data.name,
      description: user.data.description,
      public_metrics: user.data.public_metrics
    };

    cacheTimestamp = Date.now(); // Update cache timestamp

    res.json(userCache[username]);
  } catch (error) {
    if (error.code === 429) { // Rate limit error
      console.error('Rate limit exceeded, try again later.');
      res.status(429).json({ error: 'Rate limit exceeded, try again later.' });
    } else {
      console.error('Error fetching Twitter user information:', error.message);
      res.status(500).json({ error: 'Failed to fetch Twitter user information' });
    }
  }
});
/********************************************************************************* */


/* ************************************************************* */
// Middleware to parse JSON requests
app.use(express.json());


async function getUserIdFromUsername(username) {
  try {
    // Fetch the Instagram profile page
    const response = await axios.get(`https://www.instagram.com/${username}/`);
    const html = response.data;

    // Load the HTML using Cheerio
    const $ = cheerio.load(html);

    // Look for script tags that contain the user ID (it's often embedded in one of these)
    const scriptTag = $('script[type="application/ld+json"]').html();

    if (!scriptTag) {
      throw new Error('Unable to locate user information in the HTML');
    }

    // Parse the JSON data from the script tag
    const userData = JSON.parse(scriptTag);

    // Extract the user ID (if it exists in the metadata)
    const userId = userData.mainEntityofPage && userData.mainEntityofPage['@id'];
    if (!userId) {
      throw new Error('Unable to find user ID in the page data');
    }

    return userId.split('/').pop(); // Extract the numeric ID from the URL
  } catch (error) {
    console.error('Error fetching Instagram user ID:', error);
    return null;
  }
}

app.get('/api/instagram-info', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const accessToken = 'IGQWROejNZATk14RWtSLWItZAmlwcU9sN1pIa0pQUXZA4WEdiT0tudndPRGNPOW1tdUZAYOWItTmhFMFhLNkxMVE1lSV9CeFRLLUR4THE1SFp6VGNaYjFOdjN6VERQTzJydzBsRzlPRzNnRHN6YXo3bEptc2ZAVYTRHMFUZD'; // Replace with your actual access token

    // First, use Instagram Basic Display API to get the user ID based on the username
    const userIdResponse = await axios.get(`https://graph.instagram.com/v12.0/${username}`, {
      params: {
        access_token: accessToken,
        fields: 'id',  // Get the user ID
      },
    });

    const userId = userIdResponse.data.id;

    // Now that we have the user ID, fetch the user details, including the bio
    const userDetailsResponse = await axios.get(`https://graph.instagram.com/${userId}`, {
      params: {
        fields: 'id,username,account_type,media_count,biography',
        access_token: accessToken,
      },
    });

    res.json(userDetailsResponse.data);
  } catch (error) {
    console.error('Error fetching Instagram user details:', error);
    res.status(500).json({ error: 'Error fetching user details' });
  }
});


/* ************************************************************* */


app.get('/', (req, res) => {
   res.send("Hello world!");
});

app.listen(3000, () => {
   console.log('Server is running on http://localhost:3000');
});

