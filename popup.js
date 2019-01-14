
// finds the button by it's element and sets it equal to a block scoped variable 'button'
let button = document.getElementById('authBtn')

// this script utilizes chome's local storage api to query the value of 'storageObj.status'; if the status is '1' then the button's attribute will be set to disabled
  chrome.storage.local.get(['status'], function(storageObj){
    console.log('storageObj is ', storageObj)
    if (storageObj.status === 1){
      button.setAttribute('disabled', true)
    } else {
      button.removeAttribute('disabled')
    }
  })

// .1 defines a function called handler that will fire when the button is clicked (see the last variable declaration below). 

// .2 This function will first utilize chrome's messaging api to 'send a message' called 'launchOauth'(what happens to the message is unclear at this point, but, presumably, it will handled by the content script). 

// .3 This function will then utilize chrome's alarm API to 'create' an alarm called 'enableButton' set to go off in .1 minutes; the function below this listens for the alarm and then sets the attribute of the button to enabled once it 'hears' the alarm. 

// .4 Finally, this function utilizes chromes storage api to set the state of 'status' held in the the storage object hosted by chrome for the application to 1 handled in the function above if that script runs again. The callback attached to this function will set the attribute of the 'button' to disabled
function handler(){ // .1
      chrome.extension.sendMessage({ // .2 
          action: 'launchOauth'
        })
      chrome.alarms.create('enableButton', {delayInMinutes: .1}) //.3
      chrome.storage.local.set({status: 1}, function(){ //.4
        chrome.storage.local.get(['status'], function(storageObj){
          console.log('status after click is ', storageObj)
          button.setAttribute('disabled', true)
        })
      })
}

// this script utilizes the chrome alarm api to listen for an alarm. Once the alarm is fired, a message is logged to the console and chrome's storage api is queried once again. 'status' is set to 0 and the 'disabled' attribute of the 'button' is removed so that it can be clickable once again and another message indicating the status of the alarm and the current state of local storage is logged to the console.
chrome.alarms.onAlarm.addListener(function(){
  console.log('running the alarm')
  chrome.storage.local.set({status: 0}, function(){
    button.removeAttribute('disabled')
  })
  console.log('onAlarm storage status is ', localStorage)
})


// this variable declaration sets the the button's 'onclick' event equal to the function 'handler' defined above 
button.onclick = handler
