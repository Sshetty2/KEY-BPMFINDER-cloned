// The eventPage is a relatively new implementation of chrome's background scripts. Instead of keeping a persistent script running in the background, the event page will launch a single terminable instance that will only fire if neccessary when events are called. the browser will save a memory of the scripts, and, truncated copies of their execution protocols and will then relaunch them as neccessary. This approach saves CPU and Memory resources as the browser can unload the background script when not in use after some time. Only one background script may run at one time.

// ------------------------------ // 

// 1. An event listener is registered using chrome's 'runtime' platform api using the 'onInstalled' method (this event will fire when the extension is installed). NOTE: this platform api can not be used in a content script or extension scipt and only the event page/background script. 

// 2. Once the extension is installed, chrome's local storage object will be updated to set the value of 'status' to 0 (the code for handling the value of status is in the extension scripts; it will turn a button on or off);

// 3. The callback attached to the setter method will take the value that was set in the setter method as a parameter and log 'initial status is' with the value which would be set to 0 in this case.


chrome.runtime.onInstalled.addListener(function(){ // .1
  chrome.storage.local.set({status: 0}, function(innerObj){
    chrome.storage.local.get(['status'], function(storageObj){
      console.log('intial status is ', storageObj)
    })
  })
})

// The code below declares a constant that is set equal to a string 'redacted' that will be used later in the request body that will be sent as an XML request to the spotify API

const redirectUri = 'redacted'

// 1. This function declaration will take a 'code', 'grantype', and 'refreshToken'. Note: this function is used later on in this script

// 2. The function will return a new Promise object.

// 3. The Promise will instantiate a new XMLHttpRequest object and set it equal to the block-scoped variable 'xhr'; See https://developer.chrome.com/apps/xhr for details on the methods associated with the XMLHttpRequest object

// 4. The function will then initialize a new Post request at the url 'https://accounts.spotify.com/api/token'; the third parameter for the 'open' method states whether this request will be made asynchronously (which is true in this case)

// 5. The 'setRequestHeader' method as part of the XMLHttpRequest object will fill in the correct XHR request object details with the relavent request header information which is essential when making requests over HTTP. NOTE: Browsers require this information to validate the request.

// 6. This codeblock declares an 'onLoad' event handler attached to the XML request that uses chrome's XMLHttpRequest object's 'onload' method  that will be executed if and when XML data has been loaded and parsed; if the status codes are between 200 and 300, which indicate that the request has been made successfully, this function will return the response object from the request; NOTE: the 'resolve' method is part of the Promise object that was originally declared (this function is meant to return a result that will be chained to another function's input value synchronously)

// 7. This codeblock declares an 'onError' event handler attached to the XML request that uses chrome's XMLHttpRequest object's 'onerror' method that will fire if the XML request fails for whatever reason and will emit an 'Error' with the status of the XML request and status text

// 8. A new block-scoped variable named requestBody is declared and set equal to the XML request body;(conditionals are nested that handle for a refreshToken parameter that may be passed into this function).

// 9. Finally, the XML request is sent using the request body; the event handlers will handle the incoming response object or possible errors that may occur with the XML request


function makeXhrPostRequest(code, grantType, refreshToken){ //.1
  return new Promise((resolve, reject) => { //.2
    let xhr = new XMLHttpRequest(); //.3
    xhr.open('POST', 'https://accounts.spotify.com/api/token', true); //.4 
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded') //.5
    xhr.onload = function(){ //.6 
      if (xhr.status >= 200 && xhr.status < 300){
          return resolve(xhr.response);
      } else {
        reject(Error({
          status: xhr.status,
          statusTextInElse: xhr.statusText
        }))
      }
    }
    xhr.onerror = function(){ //.7
      reject(Error({
        status: xhr.status,
        statusText: xhr.statusText
      }))
    }
    //.8
     let requestBody = (refreshToken) ? 'grant_type=' + grantType + '&refresh_token=' + refreshToken + '&client_id=redacted&client_secret=' : 'grant_type=' + grantType + '&code=' + code + '&redirect_uri=' + redirectUri + '&client_id=redacted&client_secret=redacted'
    xhr.send(requestBody) //.9
  })
}

// 1. This script adds an event listener that is unique to the chrome extension messaging API. It listens for incoming messages; the listener takes a callback function that accepts three parameters; request, sender, and sendResponse. Note: sender and sendResponse are optional parameters that are not utilized in this implementation

// 2. If the 'action' associated with this particular request is called 'launchOauth' (the message will be coming from the extension script; 'popup.js'), chrome's identity API is used to initiate the authentication flow with spotify; 

// 3. As per the documentation for chrome's identity API, https://developer.chrome.com/apps/identity#method-launchWebAuthFlow, 'launchWebAuthFlow' takes an object and a callback as a parameter. The object will take a URL that 'initiates the auth flow' and a boolean for the 'interactive' flag. This flag pertains to whether or not the user is redirected to a new window for authentication or not (in this case, they are, and so, this flag is set to 'true'); 

// 4. The callback will take the resulting 'responseUrl' as a parameter.

// NOTE: This auth flow is specific for third part non-google APIs; if the API is provided by google, the auth flow is slightly different, and, it's, arguably, slightly easier to use. See https://developer.chrome.com/extensions/app_identity for more details.

// .5 within the callback as part of the auth flow, a block-scoped variable named code is declared and set equal to a reformatted version of the redirect url that was passed in as an argument (see docs and notes above) that would work with an XML Post request

// .6 an XML post request is made using the function that was defined above with the reformatted redirect url('code') passed in as a parameter as well as the 'grantType' which is ''authorization_code''. The return value of the function is a promise that can be used as the beginning of a chain for further commands

// .7 'then' is used to specify further commands on the return value of the promise; the data that was returned as a result of the XML request is now passed into a new function as a parameter that will be called 'data'

// 8. as part of the same promise chain, an event listener is created to fire when a tab is updated; the event listener accepts a callback the parameters of this callback include a tabId(integer), changeInfo(an object), and a tab (tab object that gives the state of the tab that was updated); The parameters will be filled by chrome to be used in this callback; NOTE: tabid is not used

// 9. the different properties of the objects listed here are delineated in the documentation for chromes extension tabs docs https://developer.chrome.com/extensions/tabs; the function checks that the tab has completed loading and that the URL includes spotify 

// 10. as part of the same onUpdated event listener, another chrome extension-based script is run that will determine the current tab

// 11. it will then pass this information into a callback that accepts the result of the query; the callback will use the tab id attained from the tabs passed in as an argument and the object to be sent (simply a 'json-ifiable' object; in this case, the message is the data.access_token stored in the object as 'token' that will be received by the content script) and send a message using chrome's messaging api;

// 12. the callback attached to this message returns the response object that is returned when the message is sent

// 13. the data used as a parameter is returned from the function; it does not appear that it is being used for anything meaningful after being returned from the promise

// 14. If this promise fails, the catch method will handle errors.

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){ //.1
  if (request.action === 'launchOauth'){ //.2
    chrome.identity.launchWebAuthFlow({//.3
      url: 'https://accounts.spotify.com/authorize' +
      '?client_id=redacted' +
      '&response_type=code' +
      '&redirect_uri=redacted',
      interactive: true
    },
    function(redirectUrl) { //.4 
      let code = redirectUrl.slice(redirectUrl.indexOf('=') + 1) //.5

      makeXhrPostRequest(code, 'authorization_code') //.6
        .then(data => {
          data = JSON.parse(data) //.7
          chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){//.8
            if ( //.9
              changeInfo.status === 'complete' && tab.url.indexOf('spotify') > -1
            || changeInfo.status === 'complete' && tab.url.indexOf('spotify') > -1 && tab.url.indexOf('user') > -1 && tab.url.indexOf('playlists') === -1
          ) {
              chrome.tabs.query({active: true, currentWindow: true}, function(tabs){ //.10
                  chrome.tabs.sendMessage(tabs[0].id, {token: data.access_token}, function (response) { //.11
                    console.log('response is ', response) //.12
                  });//end chrome send message
              })//end chrome tab query
            }
          })//end onUpdated event listener
          return data //.13
        })//end promise
        .catch(err => console.error(err)) //.14
    }) //launch web auth flow

  } //if statment
})// extension event listener
