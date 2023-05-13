const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');

const childProcess = require("child_process");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let GameList = [];

fetch("https://pcgamestorrents.com/games-list.html", { redirect: 'follow' }).then(e => e.text()).then(processHTML);

function getmagnetLinkDomain(html) {
  let url;
  function _bluemediafiles_decodeKey(encoded) {
    var key = '';
    for (var i = encoded.length / 2 - 5; i >= 0; i = i - 2) {
      key += encoded[i];
    }
    for (i = encoded.length / 2 + 4; i < encoded.length; i = i + 2) {
      key += encoded[i];
    }
    return key;
  }

  const doc = new JSDOM(html).window.document;
  let scripts = doc.getElementsByTagName('script');
  Object.values(scripts).forEach((script, i) => {

    var m = script.textContent.match(/Goroi_n_Create_Button[(]\"(?<encoded>.+?)\"[)];/);
    if (m && m.length > 1) {
      let key = _bluemediafiles_decodeKey(m[1]);
      url = `http://dl.pcgamestorrents.org/get-url.php?url=${key}`;
    }
  });
  return url;
}

function getMagnetLink(html) {
  const doc = new JSDOM(html).window.document;
  let url = doc.querySelector("input[type=text]").value;
  // console.log(url);
  return url;
}


function getDataFromLink(html) {
  const doc = new JSDOM(html).window.document;
  let title = doc.querySelector("h1.uk-article-title").textContent;
  let img = doc.querySelector("div > p:nth-child(3) > img").src;
  let magnetHoast = doc.querySelector("p.uk-card.uk-card-body.uk-card-default.uk-card-hover > a").href;
  return { title, img, magnetHoast };
}

function processHTML(html) {
  let list = new JSDOM(html).window.document.querySelectorAll(".uk-margin-medium-top>ul>li>a");
  GameList = list;
	ready();
}

ipcMain.handle("getTorrents", async (event, data) => {
  // console.log(data);

  let html = "";
  for (var i = data.start; i <= (data.ammount + data.start - 1) && i < GameList.length; i++) {
  	let elm = GameList[i];

		html+= (await fetch(elm.href).then(e => e.text()).then(async (html) => {
      let { title, img, magnetHoast } = getDataFromLink(html);
      // console.log(title, img);
      return await fetch(magnetHoast).then(e => e.text()).then(async html2 => {
        let url = getmagnetLinkDomain(html2);
        return await fetch(url).then(e => e.text()).then(async (html3) => { 
					return (`<div class="card" style="background-image: url(${img})">
						<div>
							<h3><div>${title}</div></h3>
							<button onclick="download(${getMagnetLink(html3)})"><svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" version="1.1"><g><path d="M.2 14.76v3.48c0 .44.36.8.8.8h3.84c.44 0 .8-.36.8-.8v-3.48H.2zM13.6 9.6v3.6h5.4v-3.6C19 4.4 14.8.2 9.6.2S.2 4.4.2 9.6v3.6H5.6v-3.6c0-2.2 1.8-4 4-4S13.6 7.4 13.6 9.6zM13.6 14.76v3.48c0 .44.36.8.8.8h3.84c.44 0 .8-.36.8-.8v-3.48H13.6z" data-darkreader-inline-fill="" style="--darkreader-inline-fill:#e8e6e3;fill: currentColor;width: 20px;height: 20px;"></path></g></svg></button>
						</div>
					</div>`);
        });
      });
    }));

  }
  // console.log(html);
  return html;
})


const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
	},
	})

	win.loadFile('index.html')
}

app.whenReady().then(() => {
	ready();
})

let __readyCount = 0;
function ready(){
	__readyCount++;
	if (__readyCount<2) return;

	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	})
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})
