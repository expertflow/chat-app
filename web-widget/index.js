const params = new URLSearchParams(window.location.search);

let widget_identifier = decodeURIComponent(params.get('widgetIdentifier'));
let service_identifier = decodeURIComponent(params.get('serviceIdentifier'));
// let customer_widget_url = params.get('customerWidgetUrl');
let channel_customer_identifier = decodeURIComponent(params.get('channelCustomerIdentifier'));
let source = '';
let message = [];
// Web Speech Api Setup
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;

function onSubmit(form){
    try {
        let formData = $(form).serializeArray();
        console.log('Form Data:', formData);
        let eventPayload = getEventPayload(formData);
        if (channel_customer_identifier && service_identifier) {
            let chatPayLoad = { type: "CHAT_REQUESTED", data: eventPayload };
            console.log("Chat Payload in Web-widget:", chatPayLoad);
            preChatForm (chatPayLoad);
            changeScreen('chat');
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

function changeScreen(screen) {
    console.log('Change Screen:', screen);
    switch (screen) {
        case 'chat':
            console.log("show chat screen");
            document.getElementById("chatbox__form").style.display = "none";
            document.getElementById("chatbox__messages").style.display = "flex";
            document.getElementById("chatbox_footer").style.display = "flex";
            break;
        case 'form':
            console.log("show form screen");
            document.getElementById("chatbox__form").style.display = "block";
            document.getElementById("chatbox__messages").style.display = "none";
            document.getElementById("chatbox_footer").style.display = "none";
            break;

    }
}

class Chatbox {
    constructor() {
        this.args = {
            openButton: document.querySelector('.chatbox__button'),
            chatBox: document.querySelector('.chatbox__support'),
            sendButton: document.querySelector('.send__button'),
            voiceButton: document.querySelector('.microphone__button')
        }
        this.state = false;
        this.messages = [];
    }
    
    display() {
        const {openButton, chatBox, sendButton, voiceButton} = this.args;

        openButton.addEventListener('click', () => this.toggleState(chatBox))
        sendButton.addEventListener('click', () => this.onSendButton(chatBox))
        voiceButton.addEventListener("click", () => this.onSendVoice(chatBox))

        const node = chatBox.querySelector('input');
        node.addEventListener("keyup", ({key}) => {
            if (key === "Enter") {
                this.onSendButton(chatBox)
            }
        })
    }
    toggleState(chatbox) {
        this.state = !this.state;

        // show or hides the box
        if(this.state) {
            chatbox.classList.add('chatbox--active')
        } else {
            chatbox.classList.remove('chatbox--active')
        }
    }
    onSendButton(chatbox) {
        var textField = chatbox.querySelector('input');
        let text1 = textField.value
        if (text1 === "") return;
        let msg1 = { name: "User", message: text1 }
        this.messages.push(msg1);
        console.log("Chat Messages: ", this.messages);
        this.updateChatText(chatbox);
        fetch(`${backend_end_url}/predict`, {
            method: 'POST',
            body: JSON.stringify({ message: text1 }),
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json'
            },
          })
          .then(r => r.json())
          .then(r => {
            let msg2 = { name: "Bot", message: r.answer };
            this.messages.push(msg2);
            this.updateChatText(chatbox)
            textField.value = ''

        }).catch((error) => {
            console.error('Error:', error);
            this.updateChatText(chatbox)
            textField.value = ''
          });
    }
    onSendVoice(chatbox){
        recognition.start();
        let utter = new SpeechSynthesisUtterance("Hi, I'm LGU Bot");
        // utter.onend = () => {recognition.start();}
        recognition.onresult = (e) => {
            let voice = e.results[e.results.length -1][0].transcript.trim();
            // console.log(e.results[e.results.length -1][0].transcript);
            let msg1 = { name: "User", message: voice }
            this.messages.push(msg1);
            console.log("Chat Messages: ", this.messages);
            this.updateChatText(chatbox);
            fetch(`${backend_end_url}/predict`, {
                method: 'POST',
                body: JSON.stringify({ message: voice }),
                mode: 'cors',
                headers: {
                  'Content-Type': 'application/json'
                },
              })
              .then(r => r.json())
              .then(r => {
                let msg2 = { name: "Bot", message: r.answer };
                this.messages.push(msg2);
                recognition.stop();
                utter.text = r.answer;
                synth.speak(utter);
                this.updateChatText(chatbox);
            }).catch((error) => {
                console.error('Error:', error);
                this.updateChatText(chatbox)
            });
        }
    }
    updateChatText(chatbox) {
        var html = '';
        this.messages.slice().reverse().forEach(function(item, index) {
            if (item.name === "Bot")
            {
                html += '<div class="messages__item messages__item--visitor">' + item.message + '</div>'
            }
            else
            {
                html += '<div class="messages__item messages__item--operator">' + item.message + '</div>'
            }
          });

        const chatmessage = chatbox.querySelector('.chatbox__messages');
        chatmessage.innerHTML = html;
    }
}
const chatbox = new Chatbox();
chatbox.display();