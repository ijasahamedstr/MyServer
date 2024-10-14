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


export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allowed methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allowed headers

  if (req.method === 'OPTIONS') {
      // Respond to preflight requests
      res.status(200).end();
      return;
  }

  // Handle your request here
  res.json({ message: 'Hello from Vercel!' });
}


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






app.get('/', (req, res) => {
   res.send("Hello world!");
});

app.listen(3000, () => {
   console.log('Server is running on http://localhost:3000');
});

