// the content script runs in the context of the browser's current displayed content. Content scripts are used to pull data from the current webpage and feed it to the background script to be used with chrome's various built-in API's or sent to the extension application via chrome's messaging protocol. It should be noted that content scripts only have limited access to chrome's built-in APIs and they are indifferent to the tabs that are currently being displayed, and so, these scripts that send messages to either the extensions running scripts or the background script will need to declare the current tab to pull data from first.

// ------------------------------ // 


// NOTE: The function declaration below is used later on in the XML request promise.

// 1. This function takes one argument that will be the response from the XML request which will be an array of parsed song data. This array will be an array of objects.

// 2. A constant named 'sontTitlesArr' is declared and set equal to an array with the elements on the page with the class name 'tracklist-name' using the ES6 spread operator syntax. The spread operator allows multiple items to be populated into an array. 

// 3. A constant named pitchClass is declared and set equal to an array of musical notes

// 4. A new block-scoped variable is declared and set equal to an array that contains each key that is a part of each song data item in the song data array

//.5 A new block-scoped variable is declared and set equal to an array that contains each tempo that is a part of each song data item in the song data array

//.6 a new block-scoped variable is declared and set equal to an array that contains each mode that is a part of each song data object in the song data array


function addSongInfoToTitle (songDataArr) {
  const songTitlesArr = [...document.getElementsByClassName('tracklist-name')]
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
  let keyArr = songDataArr.map(songDatum => songDatum.track.key)
  let bpmArr = songDataArr.map(songDatum => songDatum.track.tempo)
  let mode = songDataArr.map(songDatum => songDatum.track.mode)

  songTitlesArr.map((songTitle, index) => {
    let keyMode = (mode[index] === 1) ? 'maj' : 'min'
    return songTitle.append(` - ${pitchClass[keyArr[index]]} ${keyMode} & ${bpmArr[index].toFixed(0)} BPM`);
  });
}

function getPathname(){
  const pathname = window.location.pathname
  return pathname;
}

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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    makeXhrRequestForAlbumOrPlaylist(getPathname(), request.token)
    sendResponse('WE GOT THE MESSAGE ');
    return true;
  }
);

