
// finds the button by it's element and sets it equal to a variable
let button = document.getElementById('authBtn')

// defines a function that will utilize chome's local storage api to query the value of 'storageObj.status'; if the status is '1' then the button's attribute will be set to disabled

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

// .4 Finally, this function utilizes chromes storage api to set the state if 'status' held in the storage object hosted by chrome for the application to 1(this will activate the button 'disabled' button attribute in the function above). The callback attached to this function is largely unneccessary as it simply logs confirmation and reiterates the command to set the buttons' disabled attribute

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

chrome.alarms.onAlarm.addListener(function(){
  console.log('running the alarm')
  chrome.storage.local.set({status: 0}, function(){
    button.removeAttribute('disabled')
  })
  console.log('onAlarm storage status is ', localStorage)
})

button.onclick = handler
