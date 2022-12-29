const params = new URLSearchParams(window.location.search);

var widget_identifier = decodeURIComponent(params.get('widgetIdentifier'));
var service_identifier = decodeURIComponent(params.get('serviceIdentifier'));
var customer_widget_url = params.get('customerWidgetUrl');
var channel_customer_identifier = decodeURIComponent(params.get('channelCustomerIdentifier'));
let wrapperHide = false;

if (document.getElementById('channelIdentifier')) {
    document.getElementById('channelIdentifier').value = channel_customer_identifier;
}

origin = getOrigin();
var config_script = document.createElement('script');
var widget_script = document.createElement('script');
config_script.src = customer_widget_url + "/assets/widget/config.js";
widget_script.src = customer_widget_url + "/assets/widget/ef_widget.js";
document.getElementsByTagName('head')[0].appendChild(config_script);
document.getElementsByTagName('head')[0].appendChild(widget_script);

window.addEventListener("message", function (event) {

    if (event.origin == origin) {

        switch (event.data.type.toLowerCase()) {
            case 'minimized':
                closeWrapper();
                if (source === 'mobile') {
                    if (!isActive) {
                        document.getElementById('chatFormMain').style.display = "block";
                    }
                    return false;
                }
                iframeSize('min');
                isMax = false;
                document.getElementById('dropdownTrigger').style.display = "block";
                if (isActive) {
                    window.parent.postMessage({ type: "setDimensions", data: { width: "325px", height: "65px", bottom: 0, display: 'none' } }, "*");
                    document.getElementById('chatIconBtn').style.display = "block";
                    document.getElementById("welcomeWrapper").style.display = "none";
                    document.getElementById('chatIconBtn').style.display = "block";
                    document.getElementById('dropdownTrigger').style.display = "block";
                    document.getElementById('myDropdown').style.display = "block";
                }
                break;
            case 'maximized':
                iframeSize("max");
                isMax = true;
                document.getElementById('chatFormMain').style.display = "none";
                document.getElementById('dropdownTrigger').style.display = "none";
                document.getElementById("welcomeWrapper").style.display = "none";
                break;
            case 'initialized':
                window.parent.postMessage({ 'event': 'chat_initialized', 'message': 'Chat started successfully' }, "*");
                isActive = true;
                document.getElementById('chatFormMain').style.display = "none";
                if (isMax) {
                    document.getElementById('dropdownTrigger').style.display = "none";
                } else {
                    document.getElementById('dropdownTrigger').style.display = "block";
                }
                break;
            case 'ended':
                window.parent.postMessage({ 'event': 'chat_ended', 'message': 'Chat ended successfully' }, "*");
                isActive = false;
                if (isMax) {
                    document.getElementById('dropdownTrigger').style.display = "none";
                } else {
                    document.getElementById('dropdownTrigger').style.display = "block";
                    document.getElementById("welcomeWrapper").style.display = "none";
                }
                break;
            case 'onchatinit':
                console.log("[EVENT] onChatInit", event.data);
                break;
            case 'error':
                console.log("[EVENT] onError", event.data);
                window.parent.postMessage({ 'event': 'error', 'status': event.data.data.description, 'message': event.data.data.message }, "*");
                break;
            case 'loaded':
                let iframe = document.getElementById("ef_customer_widget");
                iframe.contentWindow.postMessage({ type: "CONFIGURATION", data: { widgetIdentifier: widget_identifier } }, customer_widget_url);
                window.parent.postMessage({
                    'event': 'configuration',
                    'message': 'configuration fetched successfully',
                    'data': {
                        'widgetIdentifier': widget_identifier,
                        'serviceIdentifier': service_identifier,
                        'channelCustomerIdentifier': channel_customer_identifier,
                        'customerWidgetUrl': customer_widget_url
                    }
                }, "*");
                iframeSize("min");
                loadLang();
                document.getElementById('dropdownTrigger').classList.remove('ef-widget-is-loading');
                if (!isActive) {
                    var isMobileApp = getUrlParameter("source");
                    var mobileApp = document.getElementById('chatFormMain');
                    if (isMobileApp === "mobile-app") {
                        source = 'mobile';
                        triggerInner = "chat";
                        mobileApp.classList.add("ef-widget-mobile-version");
                        document.getElementById("dropdownTrigger").style.display = "none"
                    }
                }
                document.getElementById('myDropdown').style.display = "block";
                document.getElementById('chatIconBtn').style.display = "block";
                document.getElementById("welcomeWrapper").style.display = "block";
                panelLang();
                setTimeout(function () {
                    document.getElementById("welcomeWrapper").style.transform = "translate(0,0)"
                }, 500);
                break;
        }
    }
});

var triggerInner;
let source = '';

var origin;

let isMax = false;
let isActive = false;
let isMobileDevice = false;

function getOrigin() {

    const origin = customer_widget_url;
    const pathArray = origin.split('/');
    const protocol = pathArray[0];
    const host = pathArray[2];
    const url = protocol + '//' + host; '//' + host;
    console.log("customer widget origin " + url)
    return url;
}

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

function chatFormAction() {
    if (source === 'mobile') {
        return false;
    }
    iframeSize("min");
    document.getElementById('chatFormMain').style.display = "none";
    document.getElementById('chatFormMain').style.display = "none";
    document.getElementById('chatIconBtn').style.display = "block";
}

function triggerSelection(e) {
    triggerInner = e;
    barLang(e);
    document.getElementById('myDropdown').classList.add('ef-widget-show-option');

    iframeSize("max");
    if (e == 'chat') {
        document.getElementById('chatIconBtn').style.display = "block";
        document.getElementById('chatFormMain').style.display = "none";
    }
}

window.onclick = function (event) {
    if (!$(event.target).hasClass('ef-widget-dropbtn')) {
        var dropdowns = document.getElementsByClassName("ef-widget-dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('ef-widget-show')) {
                openDropdown.classList.remove('ef-widget-show');
            }
        }
    }
}

function onSubmit(form) {
    try {
        let preChatFormData = $(form).serializeArray();
        let eventPayload = getEventPayload(preChatFormData);
        console.log("eventPayload ", eventPayload, preChatFormData);
        if (channel_customer_identifier && service_identifier) {
            let chatPayLoad = { type: "CHAT_REQUESTED", data: eventPayload };
            formData(chatPayLoad);
            // let iframe = document.getElementById("ef_customer_widget");
            // iframe.contentWindow.postMessage({ type: "CHAT_REQUESTED", data: eventPayload }, customer_widget_url);
            // window.parent.postMessage({ 'event': 'chat_requested', 'message': 'Chat request successfully sent' }, "*");
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
    } catch (ex) {
        console.log(ex);
        window.parent.postMessage({ 'event': 'error', 'message': ex }, "*");
        alert("something gets wrong please check console logs for details");
        return false;
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

function getEventPayload(preChatFormData) {
    if (document.getElementById('channelIdentifier') && document.getElementById('channelIdentifier').value != '') {
        channel_customer_identifier = document.getElementById('channelIdentifier').value;
    }
    return {
        serviceIdentifier: service_identifier,
        channelCustomerIdentifier: channel_customer_identifier,
        browserDeviceInfo: { browserId: '123456', browserIdExpiryTime: '9999', browserName: 'chrome', deviceType: source != "" ? source : 'desktop' },
        queue: '',
        locale: { timezone: 'asia/karachi', language: 'english', country: 'pakistan' },
        formData: getFormDataByPreChatForm(preChatFormData)
    }

}

function loadLang() {
    let browserLang = navigator.language;
    browserLang = browserLang.split('-')[0];
    switch (browserLang) {
        case 'en':
            document.getElementById("firstN_l").innerHTML = "First Name";
            document.getElementById("lastN_l").innerHTML = "Last Name";
            document.getElementById("email_l").innerHTML = "Email";
            document.getElementById("chatText").innerHTML = "Live Chat";
            panel_title_lang = "Hybrid Chat";
            panel_subtitle_lang = "Available 8am - 12am";
            panel_desc_lang = "Ask us a question, our support team is pleased to help you.";
            panel_btn_lang = "Connect with us";
            chat_bar_lang = "Let's Chat";
            chat_btn_lang = "Start Chat";
            call_bar_lang = "CallBack";
            call_btn_lang = "Send Callback Request";
            break;
        case 'ar':
            document.getElementById("chatFormMain").classList.add('lang-arabic');
            document.getElementById("firstN_l").innerHTML = "الاسم الاول";
            document.getElementById("lastN_l").innerHTML = "اسم العائلة";
            document.getElementById("email_l").innerHTML = "البريد الإلكتروني";
            document.getElementById("chatText").innerHTML = "دردشة مباشرة";
            panel_title_lang = "لندردش";
            panel_subtitle_lang = "ابدأ الدردشة";
            panel_desc_lang = "إرسال طلب رد الاتصال";
            panel_btn_lang = "أتصل مرة أخرى";
            chat_bar_lang = "لندردش";
            chat_btn_lang = "ابدأ الدردشة";
            call_bar_lang = "أتصل مرة أخرى";
            call_btn_lang = "إرسال طلب رد الاتصال";
            break;
        case 'de':
            document.getElementById("firstN_l").innerHTML = "Vornamen";
            document.getElementById("lastN_l").innerHTML = "Nachname";
            document.getElementById("email_l").innerHTML = "Email";
            document.getElementById("chatText").innerHTML = "Live-Chat";
            panel_title_lang = "Lass uns schreiben";
            panel_subtitle_lang = "Chat beginnen";
            panel_desc_lang = "Rückrufanfrage senden";
            panel_btn_lang = "Ruf zurück";
            chat_bar_lang = "Lass uns schreiben";
            chat_btn_lang = "Chat beginnen";
            call_bar_lang = "Ruf zurück";
            call_btn_lang = "Rückrufanfrage senden";
            break;
        case 'fr':
            document.getElementById("firstN_l").innerHTML = "Prénom";
            document.getElementById("lastN_l").innerHTML = "nom de famille";
            document.getElementById("email_l").innerHTML = "Email";
            document.getElementById("chatText").innerHTML = "Chat en direct";
            panel_title_lang = "Parlons";
            panel_subtitle_lang = "démarrer la discussion";
            panel_desc_lang = "Envoyer une demande de rappel";
            panel_btn_lang = "Rappeler";
            chat_bar_lang = "Parlons";
            chat_btn_lang = "démarrer la discussion";
            call_bar_lang = "Rappeler";
            call_btn_lang = "Envoyer une demande de rappel";
            break;
        case 'zh':
            document.getElementById("firstN_l").innerHTML = "名字";
            document.getElementById("lastN_l").innerHTML = "姓";
            document.getElementById("email_l").innerHTML = "電子郵件";
            document.getElementById("chatText").innerHTML = "在線聊天";
            panel_title_lang = "聊吧";
            panel_subtitle_lang = "開始聊天";
            panel_desc_lang = "發送回叫請求";
            panel_btn_lang = "打回來";
            chat_bar_lang = "聊吧";
            chat_btn_lang = "開始聊天";
            call_bar_lang = "打回來";
            call_btn_lang = "發送回叫請求";
            break;
    }
}

function barLang(data) {
    if (data === 'chat') {
        document.getElementById("headerHeading").innerHTML = chat_bar_lang;
        document.getElementById("formTrigger").value = chat_btn_lang;
    }
}

function panelLang() {
    document.getElementById("panelTitle").innerHTML = panel_title_lang;
    document.getElementById("panelSubTitle").innerHTML = panel_subtitle_lang;
    document.getElementById("panelDesc").innerHTML = panel_desc_lang;
    document.getElementById("panelBtn").innerHTML = panel_btn_lang;
}

function triggerCall(option) {
    if (isActive) {
        let iframe = document.getElementById("ef_customer_widget");
        iframe.contentWindow.postMessage({ type: 'maximized', data: null }, origin);
        return;
    }
    switch (option) {
        case 'chat':

            document.getElementById("chatFormMain").style.display = "block";
            document.getElementById("firstNameField").style.display = "block";
            document.getElementById("lastNameField").style.display = "block";
            document.getElementById("emailField").style.display = "block";
            break;
    }
}

function iframeSize(e) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        isMobileDevice = true;
    }
    switch (e) {
        case "max":

            if (isMobileDevice) {
                window.parent.postMessage({ type: "setDimensions", data: { width: "100%", height: "100%", bottom: 0, display: 'block' } }, "*");
                document.getElementById("dropdownTrigger").style.display = "none"

            } else {
                window.parent.postMessage({ type: "setDimensions", data: { width: "325px", height: "500px", bottom: 0, display: 'block' } }, "*");
                var preChatForm = document.getElementById("chatFormMain");
                preChatForm.style.height = "490px";
                preChatForm.style.width = "315px";
                document.getElementById("dropdownTrigger").style.display = "none"
            }

            break;
        case "min":
            document.getElementById("dropdownTrigger").style.display = "block"
            if (wrapperHide == false) {
                window.parent.postMessage({ type: "setDimensions", data: { width: "325px", height: "300px", bottom: 0, display: 'none' } }, "*");
            } else {
                window.parent.postMessage({ type: "setDimensions", data: { width: (document.querySelector('.ef-widget-bar-view') !== null) ? "325px" : "65px", height: "65px", bottom: 0, display: 'none' } }, "*");
            }
            break;
        case "menu":
            document.getElementById("dropdownTrigger").style.display = "block"
            window.parent.postMessage({ type: "setDimensions", data: { width: "65px", height: "175px", bottom: 0, display: 'block' } }, "*");
            break;
    }
    mobileView();
}

function mobileView() {
    if (source == 'mobile') {
        document.getElementById("dropdownTrigger").style.display = "none"
        document.getElementById("ef_customer_widget").style.width = "100%"
        document.getElementById("ef_customer_widget").style.height = "100%"
        document.getElementById("ef_customer_widget").style.zIndex = 9

    }
}

function closeWrapper() {
    wrapperHide = true;
    document.getElementById("welcomeWrapper").style.display = "none";
    window.parent.postMessage({ type: "setDimensions", data: { width: (document.querySelector('.ef-widget-bar-view') !== null) ? "325px" : "65px", height: "65px", bottom: 0, display: 'none' } }, "*");

}
