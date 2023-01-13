const params = new URLSearchParams(window.location.search);

widget_identifier = decodeURIComponent(params.get('widgetIdentifier'));
service_identifier = decodeURIComponent(params.get('serviceIdentifier'));
channel_customer_identifier = decodeURIComponent(params.get('channelCustomerIdentifier'));
let source = '';
let conversationId;
let state = false;
let isConnected = false;
let chatPayLoad;
let customerData;
let fileLoading = false;
let imageUrl = [];
let selectedFile = "";
let input_disabled = false;
let isChatClose = true;
var messages = [];

// Web Speech Api Setup
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;

window.onload = () => {
    console.log("window loaded");
    widgetConfigs(ccm_url, widget_identifier, (data) => {
        console.log('Console Data:', data);
        // Widget Config Variables
        let title = document.getElementById('title'); //Expertflow Chat
        let subTitle = document.getElementById('title'); //let's chat
        let chatHeader = document.getElementById('chatbox__header'); //#ffffff
        let chatIcon = document.getElementById('chatbox__button');
        // let customerReconnectTime = document.getElementById('title'); //0
        // let enableDownloadTranscript =  document.getElementById('title'); //false
        // let enableDynamicLink =  document.getElementById('title'); //false
        // let enableEmoji =  document.getElementById('title'); //false
        let enableFileTransfer = document.getElementById('file-btn');  //false
        // let enableFontResize =  document.getElementById('title'); //false
        // let language =  document.getElementById('title'); // en

        title.innerHTML = data.title;
        subTitle.innerHTML = data.subTitle;
        chatHeader.style.backgroundColor = data.theme;
        chatIcon.style.backgroundColor = data.theme;
        // customerReconnectTime = data.customerReconnectTime;
        // enableDownloadTranscript.setAttribute("hidden", data.enableDownloadTranscript);
        // enableDynamicLink.setAttribute("hidden", data.enableDynamicLink);
        // enableEmoji.setAttribute("hidden", data.enableEmoji);
        enableFileTransfer.setAttribute("hidden", data.enableFileTransfer);
        // enableFontResize.setAttribute("hidden", data.enableFontResize);
        // language.innerHTML = data.language.code.trim();
    });
};

const textNode = document.getElementById('textBox');
textNode.addEventListener('keyup', ({ key }) => {
    if (key === 'Enter') {
        onSendButton();
    }
});

const fileNode = document.getElementById('file-upload');
fileNode.addEventListener('change', (event) => {
    if (event.target.files && event.target.files[0]) {
        var filesAmount = event.target.files;
    } else if (event.dataTransfer.files.length > 0) {
        filesAmount = event.dataTransfer.files;
    }
    if (filesAmount) {
        selectedFile = filesAmount;
        console.log('filesssssss222333', selectedFile.length)
        // for (let i = 0; i < filesAmount.length; i++) {
        //     const reader = new FileReader();
        //     reader.onload = (event) => {
        //         console.log(imageUrl, 'urlssssssss')
        //         imageUrl.push({
        //             filesPath: event.target.result,
        //             fileType: event.target.result.split(":")[1].split("/")[0],
        //             fileExt: event.target.result.split(":")[1].split("/")[1].split(";")[0],
        //             fileName: filesAmount[i].name
        //         });
        //     };
        //     reader.readAsDataURL(filesAmount[i]);
        // }
        let additionalText = '';
        uploadFile(selectedFile, additionalText);
    }
});

function toggleState() {
    this.state = !this.state;
    let chatBox = document.querySelector('.chatbox__support');
    // show or hides the box
    (this.state) ? chatBox.classList.add('chatbox--active') : chatBox.classList.remove('chatbox--active')
}

function changeScreen(screen) {
    console.log('Change Screen:', screen);
    switch (screen) {
        case 'chat':
            console.log("show chat screen");
            document.getElementById("chatbox__form").style.display = "none";
            document.getElementById("chatbox__messages").style.display = "flex";
            document.getElementById("chatbox_footer").style.display = "flex";
            document.getElementById("chatbox__close").style.display = "inline-flex";
            this.isChatClose = false;
            break;
        case 'form':
            console.log("show form screen");
            document.getElementById("chatbox__form").style.display = "block";
            document.getElementById("chatbox__messages").style.display = "none";
            document.getElementById("chatbox_footer").style.display = "none";
            document.getElementById("chatbox__close").style.display = "none";
            this.isChatClose = true;
            break;
    }
}

function formReset() {
    const form = document.getElementById('chatForm');
    form.reset();
}

function getEventPayload(preChatFormData) {
    if (document.getElementById('channelIdentifier') && document.getElementById('channelIdentifier').value != '') {
        channel_customer_identifier = document.getElementById('channelIdentifier').value;
    }
    return {
        serviceIdentifier: service_identifier,
        channelCustomerIdentifier: channel_customer_identifier,
        browserDeviceInfo: {
            browserId: '123456',
            browserIdExpiryTime: '9999',
            browserName: 'chrome',
            deviceType: source != "" ? source : 'desktop'
        },
        queue: '',
        locale: {
            timezone: 'asia/karachi',
            language: 'english',
            country: 'pakistan'
        },
        formData: getFormDataByPreChatForm(preChatFormData)
    }
}

function getFormDataByPreChatForm(preChatFormData) {
    for (i = 0; i < preChatFormData.length; i++) {
        preChatFormData[i]['key'] = preChatFormData[i].name;
        delete preChatFormData[i]['name'];
        preChatFormData[i]['type'] = 'string'
    }
    return { id: Math.random(), formId: Math.random(), filledBy: 'web-init', attributes: preChatFormData, createdOn: new Date() }
}

function onSubmit(form) {
    try {
        let formData = $(form).serializeArray();
        console.log('Form Data:', formData);
        if (channel_customer_identifier && service_identifier) {
            let eventPayload = getEventPayload(formData);
            setUserData(eventPayload);
            return false;
        } else {
            if (!channel_customer_identifier) {
                alert('Channel Customer Identifier is Missing! Please fill the required field.');
                document.getElementById("channelIdentifier").required = true;
            } else if (!service_identifier) {
                alert('Service identifier is Missing! Please fill the required field.');
            }
            return false;
        }
    } catch (error) {
        console.log("error", error);
        alert('something gets wrong please check console logs for details');
        return false;
    }
}

function setUserData(data) {
    customerData = data;
    if (
        customerData.channelCustomerIdentifier == '' ||
        customerData.serviceIdentifier == '' ||
        customerData.browserDeviceInfo.deviceType == ''
    ) {
        return {
            type: 'ERROR',
            data: {
                code: 400,
                description: 'BAD REQUEST',
                message: 'Mandatory attributes are missing'
            }
        }
    } else {
        let user = { data: customerData };
        localStorage.setItem('user', JSON.stringify(user));
        if (localStorage.getItem('user')) {
            establish_connection(service_identifier, channel_customer_identifier, (res) => {
                try {
                    if (res.id !== undefined || res.id !== '' || res.id !== null) {
                        switch (res.type) {
                            case 'SOCKET_CONNECTED':
                                this.isConnected = true;
                                formReset();
                                changeScreen('chat');
                                this.chatPayLoad = { type: "CHAT_REQUESTED", data: customerData };
                                chatRequest(this.chatPayLoad);
                                break;
                            case 'CHANNEL_SESSION_STARTED':
                                this.conversationId = res.data.header.channelSession.conversationId;
                                localStorage.setItem('conversationId', res.data.header.channelSession.conversationId);
                                break;
                            case 'MESSAGE_RECEIVED':
                                this.messages.push(res.data);
                                pushNotification(res.data);
                                displayMessage();
                                break;
                            case 'SOCKET_DISCONNECTED':
                                if (res.data == 'io server disconnect' || res.data == 'server namespace disconnect') {
                                    console.log(`io server disconnect with reason: `, res.data);
                                    this.chatStarted = false;
                                    this.isConnected = false;
                                    this.isChatClose = true;
                                    this.message = [];
                                    changeScreen('form');
                                    localStorage.removeItem('user');
                                }
                                break;
                            case 'CONNECT_ERROR':
                                console.log(`unable to establish connection with the server: `, res.data);
                                localStorage.setItem('error', '1');
                                break;
                            case 'CHAT_ENDED':
                                this.chatStarted = false;
                                this.isConnected = false;
                                this.isChatClose = true;
                                this.message = [];
                                changeScreen('form');
                                console.log('chat end: ', data);
                                break;
                            case 'ERRORS':
                                if (res.data.task.toUpperCase() == 'CHAT_REQUESTED') {
                                    if (res.data.code == 408) {
                                        alert('Unable to connect with end server');
                                    } else if (res.data.code == 400) {
                                        alert('data is invalid');
                                    } else if (res.data.code == 500) {
                                        alert('Internal error with end server');
                                    } else {
                                        alert('Unable to send request');
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                } catch (error) {
                    console.error('Error on establishing connection: ', error)
                }
                console.log('Callback Function Response: ', res);
            });
        }

    }
}

function onSendButton() {
    let textField = document.getElementById('textBox')
    this.text = textField.value
    if (this.text.trim() !== "") {
        constructCimMessage('PLAIN', this.text.trim(), null, null, null, null, null, null, null);
        clearMessageComposer();
        textField.value = '';
    }
}

function onSendVoice() {
    recognition.start();
    recognition.onresult = (e) => {
        let voiceMessage = e.results[e.results.length - 1][0].transcript.trim();
        console.log(e.results[e.results.length - 1][0].transcript);
        if (voiceMessage !== "") {
            constructCimMessage('PLAIN', voiceMessage, null, null, null, null, null, null, null);
            clearMessageComposer();
            voiceMessage = "";
        }
    }
}

function uploadFile(files, additionalText) {
    let availableExtentions = ["txt", "png", "jpg", "jpeg", "pdf", "ppt", "pptx", "xlsx", "xls", "doc", "docx", "rtf", "mp3", "mp4", "webp"];
    let ln = files.length;
    if (ln > 0) {
        for (var i = 0; i < ln; i++) {
            const fileSize = files[i].size;
            const fileMimeType = files[i].name.split(".").pop();

            if (fileSize <= 5000000) {
                if (availableExtentions.includes(fileMimeType.toLowerCase())) {
                    let fd = new FormData();
                    fd.append("file", files[i]);
                    fd.append("conversationId", `${Math.floor(Math.random() * 90000) + 10000}`);
                    console.log("ready to Upload File", fileSize, fileMimeType);
                } else {
                    console.log(files[i].name + " File size should be less than 5MB");
                    this.imageUrl = [];
                    this.selectedFile = "";
                }
            } else {
                console.log(files[i].name + " File size should be less than 5MB");
                this.imageUrl = [];
                this.selectedFile = "";
            }
        }
    }
}

function constructCimMessage(msgType, text, intent, replyToMessageId, fileMimeType, fileName, fileSize, additionalText, fileType) {
    let header = { replyToMessageId: null, intent: null };
    let body = { markdownText: "", type: "" };
    if (msgType.toLowerCase() == "plain") {
        header.replyToMessageId = replyToMessageId ? replyToMessageId : null;
        header.intent = intent ? intent : null;
        body.type = "PLAIN";
        body.markdownText = text.trim();
    } else {
        console.log('Unable to process the file');
        return;
    }
    let msgPayload = {
        type: msgType,
        header: header,
        body: body,
        customer: this.chatPayLoad.data
    }
    sendMessage(msgPayload);
    clearMessageComposer();
    this.fileLoading = false;
    this.imageUrl = [];
    this.selectedFile = "";
}

function scrollToBottom() {
    var msgDiv = document.getElementById("chatbox__messages");
    window.scrollTo(0, msgDiv.innerHeight);
}

function clearMessageComposer() {
    this.input_disabled = false;
    this.text = "";
}

function displayMessage() {
    let msg = '';
    this.messages.slice().reverse().forEach((message, index) => {
        if (message.body.type === 'DELIVERYNOTIFICATION') {
            return false;
        }
        if (message.header.sender.type === 'BOT') {
            if (message.body.type === 'PLAIN') {
                msg += `<div class="messages__item messages__item--operator">${message.body.markdownText}</div>`
            }
            if (message.body.type === 'BUTTON') {

                msg += `<div class="chat-message agent-message bot-message">
                    <div class="chat-message-content structured-message">
                    <p><b>${message.body.additionalDetails.interactive.header.text}</b>
                    <span>${message.body.additionalDetails.interactive.body.text}</span></p>`;
                msg += `<ul class="structured-actions">`;
                for (const btn in message.body.buttons) {
                    const button = message.body.buttons[btn];
                    msg += `<li class="">${button.title}</li>`;
                }
                msg += `</ul></div></div>`;
            }
        }
        if (message.header.sender.type === 'AGENT') {
            if (message.body.type === 'PLAIN') {
                msg += `<div class="messages__item messages__item--operator">${message.body.markdownText}</div>`
            } else if (message.body.type === 'NOTIFICATION') {
                if (message.body.notificationType === 'AGENT_SUBSCRIBED') {
                    msg += `<div class="messages__item messages__item--notification">Agent join the conversation</div>`
                } else if (message.body.notificationType === 'AGENT_UNSUBSCRIBED') {
                    msg += `<div class="messages__item messages__item--notification">Agent left the conversation</div>`
                }
            }
        }
        if (message.header.sender.type === 'CUSTOMER') {
            if (message.body.type === 'PLAIN') {
                msg += `<div class="messages__item messages__item--visitor">${message.body.markdownText}</div>`
            }
        }
    })
    const chatMessage = document.getElementById('chatbox__messages');
    chatMessage.innerHTML = msg;
    console.log('msg:', msg);
    scrollToBottom();
}

function endChat() {
    let proceed = confirm("Are you sure to end the conversation?");
    if (proceed) {
        chatEnd(this.chatPayLoad.data);
    } else { return false; }
}

function pushNotification(msg) {
    if (msg.body.type.toLowerCase() !== 'notification' && msg.body.type.toLowerCase() !== 'deliverynotification') {
        const messageType = msg.header.sender.type;
        const messageText = msg.body.markdownText;
        const textType = msg.body.type;
        if (messageType == 'BOT' || messageType == 'AGENT') {
            if (textType == 'PLAIN' && document.hidden) {
                openBrowserNotification(messageType, messageText);
            }
        }
    }
}

function openBrowserNotification(head, message) {
    if (!Notification) {
        console.log("Browser does not support notifications.");
    } else {
        // check if permission is already granted
        if (Notification.permission === "granted") {
            // show notification here
            var notify = new Notification(head, {
                icon: "",
                body: message
            });
        } else {
            // request permission from user
            Notification.requestPermission()
                .then(function (p) {
                    if (p === "granted") {
                        // show notification here
                        var notify = new Notification(head, {
                            icon: "",
                            body: message
                        });
                    } else {
                        console.log("User blocked notifications.");
                    }
                })
                .catch(function (err) {
                    console.error(err);
                });
        }
    }
}
