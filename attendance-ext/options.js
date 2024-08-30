'use strict';

const webhookElem = document.getElementById('webhook-url');
const channelElem = document.getElementById('channel');
chrome.storage.local.get(['chatConfig'], function(data) {
  // console.log(data);
  if (data.chatConfig) {
    webhookElem.value = data.chatConfig.webhook ?? "";
    channelElem.value = data.chatConfig.channel ?? "";
  }
});
// console.log(webhookElem.value, channelElem.value, usernameElem.value);

const buttonClick = function(){
  const button = document.getElementById('config-set');
  button.addEventListener('click', function() {
    const chatConfig = {
      webhook: webhookElem.value,
      channel: channelElem.value,
    };
    // console.log(chatConfig);

    chrome.storage.local.set({chatConfig: chatConfig}, function() {
      console.log('chatConfig is ' + chatConfig);
    });
  });
};
buttonClick();
