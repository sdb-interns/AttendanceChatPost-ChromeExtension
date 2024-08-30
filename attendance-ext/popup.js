'use strict';

const webhookElem = document.getElementById('webhook-url');
const channelElem = document.getElementById('channel');
const useridElem = document.getElementById('userid');
chrome.storage.local.get(['chatConfig'], function(data) {
  // console.log(data);
  if (data.chatConfig) {
    webhookElem.innerText = data.chatConfig.webhook ?? "";
    channelElem.innerText = data.chatConfig.channel ?? "";
    useridElem.innerText = data.chatConfig.userid ?? "";
  }
});
// console.log(webhookElem.innerText, channelElem.innerText, usernameElem.innerText);
