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

// 1. This function will take  

function makeXhrRequest(method, url, token) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    xhr.onload = function(){
      if (xhr.status >= 200 && xhr.status < 300){
        return resolve(xhr.response);
      } else {
        reject(Error({
          status: xhr.status,
          statusTextInElse: xhr.statusText
        }))
      }
    }
    xhr.onerror = function(){
      reject(Error({
        status: xhr.status,
        statusText: xhr.statusText
      }))
    }
    xhr.send()
  })
}


function makeXhrRequestForAlbumOrPlaylist(pathname, token) {
  let albumId, requestUrl, userId, playlistId
  if (pathname.indexOf('album') > -1){
    albumId = pathname.slice(7) //gets rid of the /album/ in the pathname
    requestUrl = `https://api.spotify.com/v1/albums/${albumId}/tracks`
  } if (pathname.indexOf('playlist') > -1){
    userId = pathname.split('/')[2]
    playlistId = pathname.split('/')[4]
    requestUrl = `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`
  }
    return makeXhrRequest('GET', requestUrl, token)
    .then((data) => {
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

