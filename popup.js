const url = "https://sfapi.vladb.xyz/api/v1/slideshow/getReadSlideshow.php?id=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpZCI6MTA2OSwibG9naW4iOnRydWUsImZpcnN0bmFtZSI6IkxlbyIsImxhc3RuYW1lIjoiR29yZWwiLCJwcm9maWxlX3BpYyI6IlwvXC9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXC9hLVwvQUxWLVVqV1pURnRQQ2JUNnowTjFERTlMQ1pfRmMzbzJFY1V1Zk1RUkk0S2twcGF0NlEiLCJzdGFycyI6MCwidXNlcm5hbWUiOiIyOGdvcmVsbCJ9.gWsgrTvW7MuwuF5ggcw42Qh8IkRw9_gIRowkc1T1X10Jq8xE3UHtH3JqWpW8GXbH4bWEKR2R0NmbsWfc2s8uaI6UxKIKQfYH6PqDsJahVI7gbinQsU6jLlwVtCdUw8hsQAMxaLlvszZe1uFYZCXPqO2nI3VnWTFWuRYPcTkggbevaRafQcyPnOdOdmphBlASX81YhFYmjL_U3kxrDvCAXTtj0sastjk4KgjuyTy2Lv3SI-qCC6XSG09pb7ZslWHFmLa7dICfKV1Xqvy6poxUfqiz0wnEglpa26o0zcl4tZHXZMcDTzZDkev0BWgVr-4C2m8pjVGlZcgc12QJQIWQ7BXRPXgjPYqAE-L_oUHL73FHdsIpbCaCD3Na8gXWxYRWJKCJzObrH6Q9ts-Z_sqktAOKpGyr4Yc6k8f-xhb9VivWnZT0mbVBBbn1WWfMgbGrr2_Qqi8S18dRLf6GJHAi2H-AolC3_VjotG5KReZEGbLQ2oIJpz5KgxYn9zNVetZCUeNNQeOz7rVYOhQ3RFW04gOwUzxHi7iSALppjONUdmGJbiTr9BaqcvwrVouFQuDXsIK_uNCdQMa-KJOAhdid-RpkVjAFBVQ7fsz4DqRclt8yiYq2m2mEeoiQSOHY3Mpvks9KrokOgd2OOmImJfXAQyyyBCLT0Ym0Oyt-RtHSlqo&ssid="; // Replace with your actual URL

function slideNum() {
    return document.getElementById("slideNum").value;
}

function questionNum() {
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
    const tab = await getActiveTab();
    
    if (tab.url && tab.url.includes('scifair.vladb.xyz/classes/do/assignment/')) {
        const id = tab.url.split('/do/assignment/')[1].replace('/', '');
        try {
            const response = await fetch(url + id);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const object = await response.json();
            return object.content.artifacts;
        } catch (error) {
            console.error('Error fetching API: ', error);
            return null;
        }
    } else {
        console.error("Slideshow not found.");
        return null;
    }
}

async function getCode() {
    const artifacts = await getApi();
    if (!artifacts) {
        return "Error: Slideshow or data not found.";
    }

    const formattedCode = formatCode(artifacts[slideNum() - 1][questionNum() - 1].code);
    const processedResults = processString(formattedCode);

    return `Don't put These: ${processedResults.negativeWordsString}\nPut these: ${processedResults.positiveWordsString}`;
}

function processString(code) {
    // Step 1: Save the original string to an immutable variable
    const original = code;

    // Step 2: Remove "/n" and "/g"
    let processedString = code.replace(/\/n/g, '').replace(/\/g/g, '');

    // Step 3: Remove all special characters except .'"!()|,
    processedString = processedString.replace(/[^\w\s.'"\!\(\)\|,]/g, '');

    // Step 4: Sort into two arrays based on the statement
    const correctAnswers = [];
    const incorrectAnswers = [];
    const regex = /(!?d\.(includes|match)\(.*?\))/g;
    let match;
    while ((match = regex.exec(processedString)) !== null) {
        if (match[0].startsWith('!d.')) {
            incorrectAnswers.push(match[0]);
        } else {
            correctAnswers.push(match[0]);
        }
    }

    // Step 5 and 6: Process correct and incorrect answers
    const refinedCorrectAnswers = removeExtras(correctAnswers).map(item => item.replace(/[()]/g, ''));
    const refinedIncorrectAnswers = removeExtras(incorrectAnswers).map(item => item.replace(/[()]/g, ''));

    // Step 7: Check if both arrays are empty
    if (refinedCorrectAnswers.length === 0 && refinedIncorrectAnswers.length === 0) {
        console.log("Both arrays are empty. Continuing...");
        return { positiveWordsString: "", negativeWordsString: "" };
    }

    // Step 8: Search the original string for specific patterns
    const correctAnswerPattern = /theAnswer = \[(.*?)\]/;
    const incorrectAnswerPattern = /incorrectAnswers = \[(.*?)\]/;
    const foundCorrectAnswers = original.match(correctAnswerPattern);
    const foundIncorrectAnswers = original.match(incorrectAnswerPattern);

    if (foundCorrectAnswers) {
        refinedCorrectAnswers.push(...foundCorrectAnswers[1].split(',').map(s => s.trim()));
    }
    if (foundIncorrectAnswers) {
        refinedIncorrectAnswers.push(...foundIncorrectAnswers[1].split(',').map(s => s.trim()));
    }

    return {
        positiveWordsString: refinedCorrectAnswers.join(', '),
        negativeWordsString: refinedIncorrectAnswers.join(', ')
    };
}

function removeExtras(array) {
    return array.map(item => item.replace(/.*\((.*?)\).*/, '$1').replace(/includes/g, ''));
}

function formatCode(code) {
    const lines = code.split('\n');
    const indentedCode = lines.map(line => formatLine(line, lines)).join('\n');
    return indentedCode;
}

function formatLine(line, lines) {
    let tabs = 0;
    for (let i = 0; i < lines.length; i++) {
        (Array.from(lines[i])).forEach(character => {
            if (character == '{' || character == '(') {
                tabs++;
            } else if (character == '}' || character == ')') {
                tabs--;
            }
        });
    }
    let prepend = '';
    for (let i = 0; i < tabs; i++) {
        prepend += '\u2001';
    }
    return prepend + line;
}

async function setSlideMax() {
    const tab = await getActiveTab();
    if (tab.url && tab.url.includes('scifair.vladb.xyz/classes/do/assignment/')) {
        const id = tab.url.split('/do/assignment/')[1].replace('/', '');
        try {
            const response = await fetch(url + id);
            const object = await response.json();
            document.getElementById("slideNum").max = object.content.artifacts.length;
        } catch (error) {
            console.error('Error fetching slide max: ', error);
        }
    }
}

async function setKey() {
    document.getElementById("key").innerText = await getCode();
}

async function setQuestionMax() {
    const tab = await getActiveTab();
    if (tab.url && tab.url.includes('scifair.vladb.xyz/classes/do/assignment/')) {
        const id = tab.url.split('/do/assignment/')[1].replace('/', '');
        try {
            const response = await fetch(url + id);
            const object = await response.json();
            document.getElementById("questionNum").max = object.content.artifacts[slideNum() - 1].length;
        } catch (error) {
            console.error('Error fetching question max: ', error);
        }
    }
}

window.addEventListener("DOMContentLoaded", (event) => {
    const button = document.getElementById('keyButton');
    if (button) {
        button.addEventListener('click', setKey);
    }
    setSlideMax();
    const sNum = document.getElementById('slideNum');
    if (sNum) {
        sNum.addEventListener('change', setQuestionMax);
    }
});
