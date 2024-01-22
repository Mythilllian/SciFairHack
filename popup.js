const url = "https://sfapi.vladb.xyz/api/v1/slideshow/getReadSlideshow.php?id=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpZCI6MTA2OSwibG9naW4iOnRydWUsImZpcnN0bmFtZSI6IkxlbyIsImxhc3RuYW1lIjoiR29yZWwiLCJwcm9maWxlX3BpYyI6IlwvXC9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXC9hLVwvQUxWLVVqV1pURnRQQ2JUNnowTjFERTlMQ1pfRmMzbzJFY1V1Zk1RUkk0S2twcGF0NlEiLCJzdGFycyI6MCwidXNlcm5hbWUiOiIyOGdvcmVsbCJ9.gWsgrTvW7MuwuF5ggcw42Qh8IkRw9_gIRowkc1T1X10Jq8xE3UHtH3JqWpW8GXbH4bWEKR2R0NmbsWfc2s8uaI6UxKIKQfYH6PqDsJahVI7gbinQsU6jLlwVtCdUw8hsQAMxaLlvszZe1uFYZCXPqO2nI3VnWTFWuRYPcTkggbevaRafQcyPnOdOdmphBlASX81YhFYmjL_U3kxrDvCAXTtj0sastjk4KgjuyTy2Lv3SI-qCC6XSG09pb7ZslWHFmLa7dICfKV1Xqvy6poxUfqiz0wnEglpa26o0zcl4tZHXZMcDTzZDkev0BWgVr-4C2m8pjVGlZcgc12QJQIWQ7BXRPXgjPYqAE-L_oUHL73FHdsIpbCaCD3Na8gXWxYRWJKCJzObrH6Q9ts-Z_sqktAOKpGyr4Yc6k8f-xhb9VivWnZT0mbVBBbn1WWfMgbGrr2_Qqi8S18dRLf6GJHAi2H-AolC3_VjotG5KReZEGbLQ2oIJpz5KgxYn9zNVetZCUeNNQeOz7rVYOhQ3RFW04gOwUzxHi7iSALppjONUdmGJbiTr9BaqcvwrVouFQuDXsIK_uNCdQMa-KJOAhdid-RpkVjAFBVQ7fsz4DqRclt8yiYq2m2mEeoiQSOHY3Mpvks9KrokOgd2OOmImJfXAQyyyBCLT0Ym0Oyt-RtHSlqo&ssid="

function slideNum(){
    return document.getElementById("slideNum").value;
}

function questionNum(){
    return document.getElementById("questionNum").value;
}


async function getActiveTab() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
    return tabs[0];
}

async function getApi() {
    var tab = await getActiveTab();
    
    if (tab.url && tab.url.includes('scifair.vladb.xyz/classes/do/assignment/')) {
        var id = tab.url.split('/do/assignment/')[1];
        id = id.replace('/', '');

        return fetch(url + id)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(object => {
                return object.content.artifacts;
            })
            .catch(error => {
                console.error('Error fetching API: ', error);
            });
    } else {
        return "Slideshow not found.";
    }
}

async function getCode() {
    return getApi()
        .then(artifacts => {
            if(artifacts == "Slideshow not found."){return artifacts;}
            return formatCode(artifacts[slideNum() - 1][questionNum() - 1].code);
        })
        .catch(error => {
            return "Invalid slide or question number.";
        });
}


function formatCode(code) {
    const lines = code.split('\n');
    const indentedCode = lines.map(formatLine).join('\n');
    
    return indentedCode;
}

function formatLine(line, lineNumber, lines){
    var tabs = 0;
    for (let i = 0; i < lineNumber; i++) {
        (Array.from(lines[i])).forEach(character => 
            {
                if(character == '{' || character == '('){
                    tabs++;
                }
                else if(character == '}' || character == ')'){
                    tabs--;
                }
            });
    }
    var prepend = '';
    for (let i = 0; i < tabs; i++) {
        prepend += '\u2001';
    }
    return prepend + line;
}

async function setSlideMax(){
    var tab = await getActiveTab();
    
    if (tab.url && tab.url.includes('scifair.vladb.xyz/classes/do/assignment/')) {
        var id = tab.url.split('/do/assignment/')[1];
        id = id.replace('/', '');

        fetch(url + id)
            .then(response => {
                return response.json();
            })
            .then(object => {
                document.getElementById("slideNum").max = object.content.artifacts.length;
            });
    }
}

async function setKey(){
    document.getElementById("key").innerText = await getCode();
}

async function setQuestionMax(){
    var tab = await getActiveTab();
    
    if (tab.url && tab.url.includes('scifair.vladb.xyz/classes/do/assignment/')) {
        var id = tab.url.split('/do/assignment/')[1];
        id = id.replace('/', '');

        fetch(url + id)
            .then(response => {
                return response.json();
            })
            .then(object => {
                document.getElementById("questionNum").max = object.content.artifacts[slideNum() - 1].length;
            });
    }
}

window.addEventListener("DOMContentLoaded", (event) => {
    const button = document.getElementById('keyButton');
    if (button) {
        button.addEventListener('click', setKey);
    }
    setSlideMax();
    const sNum = document.getElementById('slideNum')
    if(sNum) {
        sNum.addEventListener('change', setQuestionMax);
    }
});

