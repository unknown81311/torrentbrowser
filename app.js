let { ipcRenderer } = require("electron");

// let form = document.querySelector("form")
// let input = document.querySelector("input")
// let responses = document.querySelector("#responses")

let start = 0;

window.getMore=(function(ammount=100){
  ipcRenderer.invoke("getTorrents", {start:start,ammount:ammount}).then(html=>document.getElementById("parent").innerHTML+=html);
  start+=ammount;
});
window.getMore();

document.getElementById("getMore").addEventListener("click",(e)=>{
  e.preventDefault();
  window.getMore()
});