// the content script runs in the context of the browser's current displayed content. Content scripts are used to pull data from the current webpage and feed it to the background script to be used with chrome's various built-in API's or sent to the extension application via chrome's messaging protocol. It should be noted that content scripts only have limited access to chrome's built-in APIs and they are indifferent to the tabs that are currently being displayed, and so, these scripts that send messages to either the extensions running scripts or the background script will need to declare the current tab to pull data from first.


// as per this script, all of the below are function declarations that will not run until the last script is run which is an on message event handler method as part of the chrome messaging platform API

// ------------------------------ // 


// The function declaration below is used later on in the XML request promise.

// 1. This function takes one argument that will be the response from the XML request which will be an array of parsed song data. This array will be an array of objects.

// 2. A constant named 'sontTitlesArr' is declared and set equal to an array with the elements on the page with the class name 'tracklist-name' using the ES6 spread operator syntax. The spread operator allows multiple items to be populated into an array. The list of items in this area will be a collection of divs that represent the 

// 3. A constant named pitchClass is declared and set equal to an array of musical notes

// 4. A new block-scoped variable is declared and set equal to an array that contains each key that is a part of each song data item in the song data array

//.5 A new block-scoped variable is declared and set equal to an array that contains each tempo that is a part of each song data item in the song data array

//.6 a new block-scoped variable is declared and set equal to an array that contains each mode that is a part of each song data object in the song data array



function addSongInfoToTitle (songDataArr) {//.1
  const songTitlesArr = [...document.getElementsByClassName('tracklist-name')]//.2
  const pitchClass = [  
    'C',
    'C♯/D♭',
    'D',
    'D♯/E♭',
    'E',
    'F',
    'F♯/G♭',
    'G',
    'G♯/A♭',
    'A',
    'A♯/B♭',
    'B'
  ]
  let keyArr = songDataArr.map(songDatum => songDatum.track.key) //.4
  let bpmArr = songDataArr.map(songDatum => songDatum.track.tempo) //.5
  let mode = songDataArr.map(songDatum => songDatum.track.mode) //.6
 
  songTitlesArr.map((songTitle, index) => {
    let keyMode = (mode[index] === 1) ? 'maj' : 'min'
    return songTitle.append(` - ${pitchClass[keyArr[index]]} ${keyMode} & ${bpmArr[index].toFixed(0)} BPM`);
  });
}
       
// This function will simply return the current pathname of the current webpage that this content script is running in.


function getPathname(){
  const pathname = window.location.pathname
  return pathname; 
}

// This function will be called inside of 'makeXhrRequestForAlbumOrPlaylist' after the request URL has been formatted correctly.

// 1. This function will take three arguments: the request method which will be passed into the XMLHttpRequest 'open' method (in this case, it will be 'GET'), a url that will be used to make the XML request(will be formatted and passed in when the function is called), and the access token that would have been received when the request object was received by the onMessage handler.

// 2. This particular function returns a promise object that will allow us to chain together our aynchronous XML request with other methods synchronously instead of using callbacks.

// 3. A new block-scoped variable named 'xhr' is created and set equal to a new XMLHttpRequest object.

// 4. The 'open' method as a part of the XMLHttpRequest object is called using the request method and request url that were passed in as parameters to the initial 'makeXhrRequest' function. The third parameter for the 'open' method states whether this request will be made asynchronously (which is true in this case).

// 5. The 'setRequestHeader' method as a part of the XMLHttpRequest object is called that sets the request headers with the access token that was retrieved from the message's request object that was passed in as a parameter to this function call.

// 6. This codeblock declares an 'onLoad' event handler attached to the XML request that uses chrome's XMLHttpRequest object's 'onload' method  that will be executed if and when XML data has been loaded and parsed. if the status codes are between 200 and 300, which indicate that the request has been made successfully, this function will return the response object from the request; NOTE: the 'resolve' method is part of the Promise object that was originally declared (this function is meant to return a result that will be chained to another function's input value synchronously)

// 7. This codeblock declares an 'onError' event handler attached to the XML request that uses chrome's XMLHttpRequest object's 'onerror' method that will fire if the XML request fails for whatever reason and will emit an 'Error' with the status of the XML request and status text

// 8. Finally, the XML request is sent using the request body; the event handlers will handle the incoming response object or possible errors that may occur with the XML request

function makeXhrRequest(method, url, token) { //.1
  return new Promise((resolve, reject) => { //.2
    let xhr = new XMLHttpRequest(); //.3 
    xhr.open(method, url, true); //.4
    xhr.setRequestHeader('Authorization', 'Bearer ' + token) //.5
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
    xhr.send() //.8
  })
}


// This is the first function call that initiates the XML HTTP Request, It will accept a pathname that is queried from the current tab that the script is running in and it will take the access token that was recieved as part of the request object as arguments. It will reformat the pathname and pass the access token into the 'makeXHRRequest' method as detailed above. Because the 'makeXhrRequest' function returns a promise object that will resolve into some return value when the asynchronous script finishes processing, we can chain further methods onto this return value. The data recieved from the request will be parsed 

// .1 A function named 'makeXhrRequestForAlbumOrPlaylist' is declared and stored in local memory that takes two arguments: a pathname that will be provided from the current window (see function declaration from above) and an access token that was received from the request object from the message that was initially recieved that initiated this particular function flow.

// .2 4 new block-scoped variables are declared for future use.

// .3 A conditional checks if 'album' is in the path name 

// .4 The prototype slice method snags only the album 'id' that spotify uses to store it's albums and is stored in the block-scoped variable albumId

// .5 A requestURL string is built using the album Id that was created in the previous line

// .6 A conditional checks if playlist is in the path name

// .7 The user's id that spotify uses and stores to identify users is retrieved from the path name and stored in the block-scoped variable 'userId'

// .8 The playlist id is also stored in a block-scoped variable named 'playlistId'

// .9 The request Url is modified to the new request URL. as of 1/14/19, this code is dysfunctional. It will not work for playlists. It appears there is no user Id in the path name anymore

// .10 this function returns a call to the function 'makeXhrRequest' that returns a promise object that can be chained together with more asynchronous methods synchronously

// .11 the then prototype method can be attached to promise objects that will return a new promise object that will accept as a parameter the value that was returned from the previous promise that it was chained to. In this case the returned value from the previous promise is passed in as an argument called data.

// .12


function makeXhrRequestForAlbumOrPlaylist(pathname, token) { //.1 
  let albumId, requestUrl, userId, playlistId //.2
  if (pathname.indexOf('album') > -1){ //.3
    albumId = pathname.slice(7) //.4
    requestUrl = `https://api.spotify.com/v1/albums/${albumId}/tracks`//.5
  } if (pathname.indexOf('playlist') > -1){ //.6
    userId = pathname.split('/')[2] //.7
    playlistId = pathname.split('/')[4] //.8
    requestUrl = `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks` //.9
  }
    return makeXhrRequest('GET', requestUrl, token) // .10
    .then((data) => { // .11
      let parsedData = JSON.parse(data) 
      let hrefArr = parsedData.items.map(item => {
        return (item.hasOwnProperty('track')) ? item.track.href : item.href
      })
      return hrefArr
    })
    .then(songLinkArr => {
      let audioAnalysisEndpointArr = songLinkArr.map(link => {
        return link.replace(/tracks/i, 'audio-analysis')
      });
      return audioAnalysisEndpointArr
    })
    .then(songRequestUrlArr => {
      return Promise.all(songRequestUrlArr.map(songRequestUrl => {
        return makeXhrRequest('GET', songRequestUrl, token)
      }))
    })
    .then(songDataArr => {
      let parsedSongDataArr = songDataArr.map(songData => JSON.parse(songData))
      addSongInfoToTitle(parsedSongDataArr)
    })
    .catch(err => {
      console.error('AHHHHH', err);
    })

}

// 1. This script uses chrome's messaging platform api to register an event handler that will listen for incoming messages. The incoming message, in this case, will be coming from the background script / event page AFTER the event page receives its message from the extension script and calls it's function to make 'makeXhrPostRequest'.

// 2. The 'onMessage' event listener takes a callback function that takes three parameters: the request which will be the request object that will be received by any onMessage listener, a message sender object that will contain details regarding the sender of the message and the context in which it was sent in, and a sendResponse callback function that will fire when the message has been received. See : https://developer.chrome.com/extensions/runtime#type-MessageSender for more details.

// 3. The function defined above will take two parameters: a getPathname funciton that will fire immediately and find the pathname of the current url that the script is running in and the token value that is part of the request object that the 'onMessage' handler is receiving. See the function declaration to see how the XML request is made.

// 4. the sendResonse callback function will return a string 'WE GOT THE MESSAGE' which will be handled in 'eventPage.js'. It will accept a response object and deconstruct it to get the raw string. 

chrome.runtime.onMessage.addListener( //.1
  function(request, sender, sendResponse) { //.2
    makeXhrRequestForAlbumOrPlaylist(getPathname(), request.token) //.3
    sendResponse('WE GOT THE MESSAGE '); //.4
    return true;
  }
);

