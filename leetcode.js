//graphql query
const query = `
  query getUserProfile($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      contributions {
        points
      }
      profile {
        reputation
        ranking
      }
      submissionCalendar
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

const profileQuery = `
query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
        username
        githubUrl
        linkedinUrl
        profile {
            ranking
            userAvatar
            realName
      aboutMe
      school
      websites
      skillTags
    }
  }
}
  `


// format data
const formatData = (data) => {
    let sendData = {
        ttl: data.matchedUser.submitStats.acSubmissionNum[0].count,
        easy: data.matchedUser.submitStats.acSubmissionNum[1].count,
        medium: data.matchedUser.submitStats.acSubmissionNum[2].count,
        hard: data.matchedUser.submitStats.acSubmissionNum[3].count,
    }
    return sendData;
}
const formatProfile = (data) => {
    let sendData = {
        username: data.matchedUser.username,
        profile: data.matchedUser.profile,
    }
    return sendData;
}


exports.profile = async (user) => {
    const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com'
        },
        body: JSON.stringify({ query: profileQuery, variables: { username: user } }),
    })
    const data = await res.json()
    try {
        if (data.errors) {
            return data;
        } else {
            return formatProfile(data.data)
        }
    } catch (err) {
        console.log('Error', err);
        return {

        }
    }
}

//fetching the data
exports.leetcode = async (user) => {
    const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com'
        },
        body: JSON.stringify({ query: query, variables: { username: user } }),
    })
    const data = await res.json()
    try {
        if (data.errors) {
            return data;
        } else {
            return formatData(data.data)
        }
    } catch (err) {
        console.log('Error', err);
        return {

        }
    }
}
