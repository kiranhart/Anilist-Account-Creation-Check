const API_URL = 'https://graphql.anilist.co/';
const POSSIBLE_BACKGROUNDS = ['bg1.png'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const USERNAME_INPUT = document.querySelector('#usernameInput');
const AVATAR_BOX = document.querySelector('#avatarBox');
const ACCOUNT_CREATION_BOX = document.querySelector('#accountCreationDate');

let lastFetchedUsername = '';

const fetchAccountCreationTime = async(username) => {
    const request = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({
            query: `{
                User(name: "${username}") {
                    createdAt,
                    id,
                    name,
                    avatar {
                        large
                    }
                }
            }`
        })
    })

    const {data: { User }} = await request.json();
    const status = request.status;
    
    if (User.createdAt === null) {
        const requestFirstActivity = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                query: `{
                    Activity(userId: ${User.id} sort:ID) {
                        ... on TextActivity {
                            id,
                            createdAt
                        }
                    
                        ... on ListActivity {
                            id,
                            createdAt
                        }
                      
                        ... on MessageActivity {
                            id,
                            createdAt
                        }
                    }
                }`
            })
        })
    
        const {data: { Activity: {createdAt} }} = await requestFirstActivity.json();
        return {
            status,
            id: User.id,
            name: User.name,
            created: createdAt,
            avatar: User.avatar.large
        }
    }

    return {
        status,
        id: User.id,
        name: User.name,
        created: User.createdAt,
        avatar: User.avatar.large
    }
};

const convertToReadableTime = (seconds) => {
    const date = new Date(0);
    date.setUTCSeconds(seconds);
    return `${MONTHS[date.getMonth()]} ${getDaySuffix(date.getDay())}, ${date.getFullYear()}`;
}

//  https://stackoverflow.com/a/13627586   <3
const getDaySuffix = (i) => {
    const j = i % 10, k = i % 100;
    
    if (j == 1 && k != 11) {
        return i + "st";
    }

    if (j == 2 && k != 12) {
        return i + "nd";
    }
    
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    
    return i + "th";
}

// set a random bg on load
document.querySelector('body').style.backgroundImage = `url('./assets/${POSSIBLE_BACKGROUNDS[Math.floor(Math.random() * POSSIBLE_BACKGROUNDS.length)]}')`;

USERNAME_INPUT.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        handleClick();
    }
})

const handleClick = async() => {
    if (!USERNAME_INPUT.value) return;
    if (lastFetchedUsername == USERNAME_INPUT.value) {
        console.log('user attempted to refetch their info')
        return;
    }

    const fetchedInfo = await fetchAccountCreationTime(USERNAME_INPUT.value);
    lastFetchedUsername = USERNAME_INPUT.value;

    if (fetchedInfo.status == 200) {
        AVATAR_BOX.setAttribute('src', fetchedInfo.avatar)
        ACCOUNT_CREATION_BOX.innerHTML = `🎂 ${convertToReadableTime(fetchedInfo.created)} 🎂`
    }
}