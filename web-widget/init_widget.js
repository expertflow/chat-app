var init_widget_url = __bot.widgetUrl;
var service_identifier = encodeURIComponent(__bot.serviceIdentifier);
var widget_identifier = encodeURIComponent(__bot.widgetIdentifier);
var channel_customer_identifier = encodeURIComponent(('; ' + document.cookie).split(`; _ga=`).pop().split(';')[0]);

console.log(__bot);

const URL = init_widget_url + '?widgetIdentifier=' + widget_identifier + '&serviceIdentifier=' + service_identifier + '&channelCustomerIdentifier=' + channel_customer_identifier;

// window.onload = function () {
    
    let parentSection = document.createElement('div');
    parentSection.setAttribute('id', 'init_widget_main');
    parentSection.style.border = '0';
    parentSection.style.float = 'right';
    parentSection.style.position = 'fixed';
    parentSection.style.bottom = '0';
    parentSection.style.right = '0';
    parentSection.style.width = '0';
    parentSection.style.height = '0';
    parentSection.style.background = 'rgba(0,0,0,.00)';
    parentSection.style.maxWidth = '100%';
    parentSection.style.maxHeight = 'calc(100% - 0px)';
    parentSection.style.minHeight = '0px';
    parentSection.style.minWidth = '0px';
    parentSection.style.zIndex = '9999'

    let ifrm = document.createElement('iframe');
    ifrm.setAttribute('id', 'init_widget');
    ifrm.setAttribute('width', '380px');
    ifrm.setAttribute('height', '580px');
    ifrm.setAttribute('src', URL);
    ifrm.setAttribute('allow','camera;microphone');
    ifrm.style.border = '0';
    ifrm.style.float = 'right';
    ifrm.style.position = 'absolute';
    ifrm.style.bottom = '0';
    ifrm.style.right = '0';
    ifrm.style.minHeight = '0px';
    ifrm.style.minWidth = '0px';
    ifrm.style.background = 'rgba(0,0,0,.00)';
    document.body.appendChild(parentSection);
    parentSection.appendChild(ifrm);
// }