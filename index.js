const axios = require("axios");
require("dotenv").config()
const username = "manishkumarraigithub";
const express = require("express");
const app = express();
const http = require("http").Server(app);
const port = process.env.PORT || 3000;
const db = require("./config/database");
const email = process.env.EMAIL;
const pass = process.env.PASS;
const cron = require("node-cron");
const API_TOKEN = process.env.BOT_TOKEN;
const { Telegraf, Markup } = require("telegraf");
const bot = new Telegraf(API_TOKEN);
const leet = require('./leetcode');
var mongoose = require('mongoose');

app.use(
    express.urlencoded({
        extended: true,
    })
);
const stats = {
    first: true,
    ttl: 0,
};

let latestData = {};

app.use(express.json());
app.use("/static", express.static(__dirname + "/static"));
const mailer = require("nodemailer");
const { userSchema } = require("./modal");
const sender = mailer.createTransport({
    service: "gmail",
    auth: {
        user: email,
        pass: pass,
    },
});

const sendBulkMail = async () => {
    const rows = await userSchema.find({}, { email: 1, _id: 0 })
    console.log(rows)
    rows.map((to) => {
        const options = {
            from: email,
            to: to.email,
            subject: "Attention: Manish sir just solved a problem",
            html: `${generateMail()}`,
        };
        sender.sendMail(options, (err, data) => {
            if (err) {
                console.log(err);
            } else {
                console.log(`email sent to ${to.email}`);
            }
        });
    });
};
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

const sendTgMsg = () => {
    bot.telegram.sendMessage(
        "@leetcodermanish",
        `Attention Everybody\n\nManish Just Solved a new Question on leetcode.\n\nCurrent Stats: \nTotal Solved: ${latestData.ttl}\nEasy: ${latestData.easy}\nMedium: ${latestData.medium}\nHard: ${latestData.hard}\n\nOn behalf of all the people in this community, I'm congratulating Manish for such a feat.`,
        Markup.inlineKeyboard([
            Markup.button.url(`Check Profile`, `leetcode.com/${username}`),
        ])
    );
};

const getStatsHelper = async (req, res) => {
    const data = await leet.leetcode(username);
    latestData = data;
    if (stats.ttl < data.ttl) {
        stats.ttl = data.ttl;
        if (stats.first) {
            stats.first = false;
        } else {
            sendBulkMail();
            sendTgMsg();
        }
    }
    res.json(data);
};

app.get("/getStats", async (req, res) => {
    getStatsHelper(req, res);
});
app.get("/getProfile", async (req, res) => {
    const data = await leet.profile(username);
    res.json(data);
});
app.post("/submitForm", async (req, res) => {
    const email = req.body.email;
    if (!validateEmail(email)) {
        res.json({ status: false, invalid: true });
        return;
    }

    const dupEmail = await userSchema.findOne({ email: email });

    if (dupEmail) {
        res.send({ status: false, dup: true });
        return;
    }
    try {
        await new userSchema({ email }).save();
        res.status(200).json({ status: true });
        return
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'internal error', status: false });
        return
    }
    res.send({ status: true });
});
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/sendtg", (req, res) => {
    sendTgMsg();
    res.end("message sent on telegram");
});
app.get("/sendmail", (req, res) => {
    sendBulkMail();
    res.end("message sent on Email");
});


const job = cron.schedule("*/5 * * * *", getStatsHelper);


mongoose.connect(
    process.env.DATABASE_URL,
    {
        useNewUrlParser: true,
    }
);
var conn = mongoose.connection;
conn.on('connected', function() {
    console.log('database is connected successfully');
    http.listen(port, async () => {
        job.start();
        console.log(`running on port ${port}`);
    });

});
conn.on('disconnected', function() {
    console.log('database is disconnected successfully');
});
conn.on('error', console.error.bind(console, 'connection error:'));

const generateMail = () => {
    return `
<html>
        <body style="margin:0;padding:0;color:#5c5c5c;font-size:16px;width:100vw;overflow:hidden;box-sizing:border-box;">
                <table style="width: 100%;">
                        <div class="main" style="margin:0;padding:0;overflow:hidden;box-sizing:border-box;width:100vw;" >
                                <div class="section" style="margin:0;padding:0;overflow:hidden;box-sizing:border-box;width:100%;margin-top:40px">
                                        <h1 style="margin:0;padding:0;font-size:2.2rem;margin-top:5px;text-align:center;" >LeetCoder Manish</h1>
                                </div>
                                <div class="section" style="margin:0;padding:0;overflow:hidden;box-sizing:border-box;width:100%;margin-top:40px" >
                                        <p style="margin:0;padding:0;overflow:hidden;box-sizing:border-box;font-size:1.2rem;text-align:center;line-height:150%" >
Attention Everybody\n\nManish Just Solved a new Question on leetcode.\n\nCurrent Stats: \nTotal Solved: ${latestData.ttl}\nEasy: ${latestData.easy}\nMedium: ${latestData.medium}\nHard: ${latestData.hard}\n\nOn behalf of all the people in this community, I'm congratulating Manish for such a feat.\n\nYou can also congratulate him through our Telegram Channel at <a href="https://t.me/leetcodermanish">@leetcodermanish</a>
                                        </p>
                                </div>
                                        <div class="section" style="width:100%;margin-top:40px" >
                                                <div style="font-size:1.3rem;font-weight:300;margin:8px;text-align:center;"><a style="cursor:pointer; color:red; text-decoration:none;padding:5px;" href="https://leetcode.com/${username}" >Check Profile</a></div>
                                        </div>
                        </div>
                </table>
        </body>
</html>
        `;
};
