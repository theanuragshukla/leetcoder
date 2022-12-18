const axios = require('axios')
const username = "manishkumarrai"
const express = require("express")
const app = express()
const http = require("http").Server(app)
const port = process.env.PORT || 3000
const db = require('./config/database')
const email = process.env.EMAIL
const pass = process.env.PASS
const cron = require('node-cron')
app.use(express.urlencoded({
        extended:true
}))
const stats = {
        first:true,
        ttl:0
}
app.use(express.json())
app.use('/static', express.static(__dirname+'/static'))
const mailer = require('nodemailer')
const sender = mailer.createTransport({
        service: 'gmail',
        auth: {
                user: email,
                pass: pass
        }
})


const sendBulkMail = async ()=>{
        const query = `SELECT * FROM emails WHERE id > $1;`
        const value = [-1]
        const {rows} = await db.query(query, value)
        rows.map((to)=>{
                const options = {
                        from: email,
                        to: to.email,
                        subject: 'NOTICE: Manish sir just solved a problem',
                        html: `${generateMail()}`
                }
                sender.sendMail(options, (err, data)=>{
                        if (err) {
                                console.log(err);
                        } else {
                                console.log(`email sent to ${to.email}`);
                        }
                })
        })
}
const getProfile = async () => {
        const data =    await axios.post('https://leetcode.com/graphql',
{"query":"\n    query userPublicProfile($username: String!) {\n  matchedUser(username: $username) {\n    contestBadge {\n      name\n      expired\n      hoverText\n      icon\n    }\n    username\n    githubUrl\n    twitterUrl\n    linkedinUrl\n    profile {\n      ranking\n      userAvatar\n      realName\n      aboutMe\n      school\n      websites\n      countryName\n      company\n      jobTitle\n      skillTags\n      postViewCount\n      postViewCountDiff\n      reputation\n      reputationDiff\n      solutionCount\n      solutionCountDiff\n      categoryDiscussCount\n      categoryDiscussCountDiff\n    }\n  }\n}\n    ","variables":{"username":username}}
        )
        const ret = data.data.data.matchedUser.profile
        ret.username = data.data.data.matchedUser.username
        return ret
        }

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const getStats = async () => {
        const ret =     await axios.post('https://leetcode.com/graphql',
                {"query":"\n    query userProblemsSolved($username: String!) {\n  allQuestionsCount {\n    difficulty\n    count\n  }\n  matchedUser(username: $username) {\n    problemsSolvedBeatsStats {\n      difficulty\n      percentage\n    }\n    submitStatsGlobal {\n      acSubmissionNum {\n        difficulty\n        count\n      }\n    }\n  }\n}\n    ","variables":{"username":username}})
        return ret.data.data.matchedUser.submitStatsGlobal.acSubmissionNum
        }

const getStatsHelper = async (req, res) => {
   const data = await getStats()
	console.log(stats)
	console.log(data)
        if(stats.ttl<data[0].count){
                stats.ttl = data[0].count
                if(stats.first){
                        stats.first=false
                }else{
                        sendBulkMail()
                }
        }
        res.json(data)

}

app.get('/getStats',async (req, res)=>{
	getStatsHelper(req, res)
  })

app.get('/getProfile',async (req, res)=>{
        const data = await getProfile()
        res.json(data)
})
app.post('/submitForm',async(req,res)=>{
        const email = req.body.email
        if(!validateEmail(email)){
                res.json({status:false,invalid:true})
                return
        }
        const emailquery = `SELECT * FROM emails WHERE email = $1 ;`;
        const emailvalues = [email];
        const dupUser = await db.query(emailquery, emailvalues);
        if( dupUser.rows.length!=0){
                res.send({status:false,dup:true})
                return
        }
        const query = `
        INSERT INTO emails (email)
        VALUES($1)
        RETURNING *;
        `;
        const values = [email];
        await db.query(query, values)
        res.send({status:true})

})



app.get('/', (req, res)=>{
        res.sendFile(__dirname+'/index.html')
})

const job = cron.schedule("*/5 * * * *", getStatsHelper)


const server = http.listen(port, ()=>{
	job.start()
	console.log(`running on port ${port}`);
})



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
                                        Manish just solved a new problem on LeetCode.
                                        </p>
                                </div>
                                        <div class="section" style="width:100%;margin-top:40px" >
                                                <div style="font-size:1.3rem;font-weight:300;margin:8px;text-align:center;"><a style="cursor:pointer; color:red; text-decoration:none;padding:5px;" href="https://leetcode.com/${username}" >Check Profile</a></div>
                                        </div>
                        </div>
                </table>
        </body>
</html>
        `
                        }
