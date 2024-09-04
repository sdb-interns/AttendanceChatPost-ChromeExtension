const sleep = waitTime => new Promise( resolve => setTimeout(resolve, waitTime) );

let mfckExtUser = '';
let chatConf = {};

function loadChatConf(){
    chrome.storage.local.get(['chatConfig'], function(data) {
        if (data.chatConfig) {
            chatConf.webhook = data.chatConfig.webhook;
            chatConf.channel = data.chatConfig.channel;
            chatConf.userid = data.chatConfig.userid;
        }
    });
};

function messageFormat(userText, dateText, text) {
    return `${userText} - \`${dateText}\` ${text}`
}

function lastMessageFormat(userText, chats, messageText) {
    const mention = chatConf.userid ? `<@${chatConf.userid}>` : userText;
    return `${mention}さんが今日の勤務報告を送信しました。\n\n ${chats.join('\n')} \n\n${messageText}`;
}


function getUserText() {
    // console.log('getUserText')
    let userElem = document.getElementsByClassName("attendance-header-user-name")[0];
    userElem = userElem||document.getElementsByClassName("attendance-mobile-header-user-name")[0];
    // console.log(userElem);

    let userName = '';
    if (userElem && userElem.hasChildNodes()) {
        if (userElem.childElementCount == 1) {
            userName = userElem.firstElementChild.innerText;
        } else {
            [...userElem.childNodes].forEach(function(element) {
                if (!element.hasChildNodes()) {
                    userName = element.data;
                } else if (element.innerText.endsWith('さん')) {
                    userName = element.innerText;
                }
            });
        }
    }
    // console.log(userName);

    const re = /^(.+?)さん$/
    mfckExtUser = re.exec(userName)[1];
    mfckExtUser = mfckExtUser.replaceAll(/[ 　]/g, ' ');
    // console.log(user);
    return mfckExtUser;
}
function getDateText() {
    // console.log('getDateText')
    const statusContainer = document.getElementsByClassName('status-container')[0];
    const dateStr = statusContainer.firstElementChild.firstElementChild.firstElementChild.innerText.replaceAll(' ', '');
    const timeStr1 = statusContainer.lastElementChild.firstElementChild.firstElementChild.innerText;
    const timeStr2 = statusContainer.lastElementChild.firstElementChild.lastElementChild.innerText;
    const ret = `[${dateStr} ${timeStr1}:${timeStr2}]`;
    // console.log(ret);
    return ret;
}
function getAllDateText() {
    let chats = ['*日付*'];
    const historyListGroups = document.getElementsByClassName('history-list-group');
    let historyListGroup = historyListGroups[0];

    // historyListGroup とその子要素が存在するかをチェック
    if (historyListGroup && historyListGroup.firstElementChild && historyListGroup.firstElementChild.firstElementChild) {
        const dateStr = historyListGroup.firstElementChild.firstElementChild.innerText;
        chats.push(`${dateStr}`);
        chats.push('\n*勤怠*');

        const addHistory = (group) => {
            if (group && group.lastElementChild && group.lastElementChild.children) {
                Array.from(group.lastElementChild.children).reverse().forEach(element => {
                    if (element.firstElementChild && element.firstElementChild.firstElementChild && element.firstElementChild.lastElementChild) {
                        chats.push(`${element.firstElementChild.lastElementChild.innerText} ${element.firstElementChild.firstElementChild.innerText}`);
                    }
                });
            }
        };

        // 最初のhistoryListGroupから履歴を追加
        addHistory(historyListGroup);
        const beforeHistory = historyListGroups[1];
        // 最初のhistoryListGroupに履歴がない場合、次の候補をチェック
        if (chats.length === 3 && beforeHistory) {
            addHistory(beforeHistory);
            chats[1] = beforeHistory.firstElementChild.firstElementChild.innerText;
        }
    }

    return chats;
}
function getMessageText(text) {
    // console.log(text);
    return messageFormat(mfckExtUser||getUserText(), getDateText(), text)
}

function getLastMessageText(messageText) {
    return lastMessageFormat(mfckExtUser||getUserText(), getAllDateText(), messageText);
}

/**
 * for `mypage.moneyforward.com`
 */
function getUserText2() {
    mfckExtUser = document.getElementById('root').firstElementChild.firstElementChild.lastElementChild.lastElementChild.firstElementChild.firstElementChild.innerText;
    mfckExtUser = mfckExtUser.replaceAll(/[ 　]/g, ' ');
    // console.log(ret);
    return mfckExtUser;
}
/**
 * for `mypage.moneyforward.com`
 */
function getDateText2() {
    let ret = '';
    document.getElementsByTagName('attendance-time-record-container')[0].shadowRoot.childNodes.forEach(function(element) {
        // console.log(element.tagName);
        if (element.tagName === 'SECTION') {
            const dateStr = element.getElementsByClassName('status-container')[0].firstElementChild.getElementsByTagName('section')[0].innerText.replaceAll(' ', '');
            const timeStr1 = element.getElementsByClassName('status-container')[0].lastElementChild.firstElementChild.firstElementChild.innerText;
            const timeStr2 = element.getElementsByClassName('status-container')[0].lastElementChild.firstElementChild.lastElementChild.innerText;
            ret = `[${dateStr} ${timeStr1}:${timeStr2}]`;
        }
    });
    // console.log(ret);
    return ret;
}
/**
 * for `mypage.moneyforward.com`
 */
function getMessageText2(text) {
    // console.log(text);
    return messageFormat(mfckExtUser||getUserText2(), getDateText2(), text)
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 月は0から始まるため+1
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isEndOfMonth() {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return today.getDate() === lastDayOfMonth;
}
function dataJson(messageText){
    // console.log(messageText);
    let ret = {
        "text": messageText,
        "username": "勤怠"
    };

    if (chatConf.channel) {
        ret.channel = chatConf.channel;
    }

    // console.log(ret);
    return ret;
}

function lastDataJson(messageText) {
    let ret = {
        "text": messageText,
        "username": "勤怠"
    };

    if (chatConf.channel) {
        ret.channel = chatConf.channel;
    }

    ret.blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": messageText
            }
        },
    ];

    if (isEndOfMonth()) {
        const alertMessage = "⚠️ 注意: 本日は月末です。勤怠と経費精算を忘れずに提出してください。";
        ret.attachments = [
            {
                "color": "#f2c744",
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": chatConf.userid
                              ? `<@${chatConf.userid}>\n${alertMessage}`
                              : alertMessage
                        }
                    }
                ]
            }
        ];
    }

    // console.log(ret); // デバッグ用

    return ret;
}


function postChat(data){
    // console.log(data);
    fetch(chatConf.webhook, {
        method: "POST",
        mode: "no-cors",
        cache: "no-cache",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
        // })
        // .then(res => res.json())
        // .then(result => {
        //     console.log(result);
        // }).catch((e) => {
        //     console.error(e);
    });
}

function chatPostByClick(messageText) {
    // console.log(messageText);
    const data = dataJson(messageText);
    // console.log(data);
    postChat(data);
}

function chatPostByLastClick(messageText) {
    // console.log(messageText);
    const data = lastDataJson(messageText);
    // console.log(data);
    postChat(data);
}

(async function() {
    /* load configration */
    loadChatConf();

    /* event */
    const chatPostEventName = 'click';
    /*
     * for `attendance.moneyforward.com`
     */
    if (location.hostname === 'attendance.moneyforward.com' && location.pathname === '/my_page') {
        [...document.getElementsByClassName('time-stamp-button')].forEach(function(element) {
            element.addEventListener(chatPostEventName, async function (e) {
                if (element.innerText === '退勤') {
                    await sleep(1000);
                    const dialog = document.createElement('dialog');
                    dialog.style = `
                        max-width: 600px;
                        width: 100%;
                        padding: 24px;
                        background-color: #fff;
                        border-radius: 8px;
                        border: none;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    `;
                    dialog.innerHTML = `
                        <form method="dialog" style="display: flex; flex-direction: column; gap: 16px;">
                            <hgroup>
                                <h1 style="font-size: 24px; font-weight: 700;">今日の勤務報告</h1>
                                <p style="font-size: 16px;">勤務報告を送信しますか？</p>
                            </hgroup>
                            <p id="errorMessage" style="display: none; font-size: 16px; color: red;"></p>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <label for="whatIDid" style="font-size: 14px; font-weight: 700;">やったこと</label>
                                <textarea name="whatIDid" id="whatIDid" cols="30" rows="10"></textarea>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <label for="whatToDo" style="font-size: 14px; font-weight: 700;">次回やること</label>
                                <textarea name="whatToDo" id="whatToDo" cols="30" rows="10"></textarea>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <label for="nextDate" style="font-size: 14px; font-weight: 700;">次回の勤務</label>
                                <input type="date" name="nextDate" id="nextDate">
                            </div>
                            <menu>
                                <button value="cancel">キャンセル</button>
                                <button value="submit" autofocus>送信</button>
                            </menu>
                        </form>
                    `;
                    document.body.appendChild(dialog);
                    dialog.showModal();
                    const form = dialog.querySelector('form');
                    const cancelButton = document.querySelector('button[value="cancel"]');
                    const submitButton = document.querySelector('button[value="submit"]');

                    // キャンセルボタンが押された時の処理
                    cancelButton.addEventListener('click', () => {
                        dialog.close();
                    });

                    // 送信ボタンが押された時の処理
                    submitButton.addEventListener('click', () => {
                        const whatIDid = form.elements['whatIDid'].value ?? '';
                        const whatToDo = form.elements['whatToDo'].value ?? '';
                        const nextDate = form.elements['nextDate'].value ?? '';
                        const messageText = `*やったこと* \n ${whatIDid}\n\n *次回やること* \n ${whatToDo}\n\n *次回の勤務* \n ${nextDate} \n`;
                        chatPostByLastClick(getLastMessageText(messageText));
                        dialog.close();
                    });
                } else {
                    chatPostByClick(getMessageText(element.innerText));
                }
            });
        });
    }

    /*
     * for `mypage.moneyforward.com`
     */
    if (location.hostname === 'mypage.moneyforward.com' && location.pathname === '/') {
        await sleep(1000);
        document.getElementsByTagName('attendance-time-record-container')[0].shadowRoot.childNodes.forEach(
            function(element) {
                if (element.tagName === 'SECTION') {
                    [...element.getElementsByClassName('time-stamp-button')].forEach(function(elem) {
                        elem.addEventListener(chatPostEventName, function(e) {
                            chatPostByClick(getMessageText2(elem.innerText));
                        });
                    });
                }
            }
        );
    }
})();

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
        const storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".',
            key,
            namespace,
            storageChange.oldValue,
            storageChange.newValue
        );
    }
    loadChatConf();
});
