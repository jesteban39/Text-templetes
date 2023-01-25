         
chrome.storage.local.get('templet',async ({templet}) => {
    const templetContent = document.createElement('p');
    templetContent.innerHTML = templet.content;
    const [body] = document.getElementsByTagName('body');            
    //body.appendChild(templetContent);
    
    //console.log(document.execCommand('copi'));

    //let pasteText = document.querySelector("#output");
    //pasteText.focus();
    
    //document.execCommand("paste");
    //console.log(pasteText.textContent);

    document.body.querySelector("*:focus").innerText = selection.content;
});     
//args: [],
//css: '.modal {    position: fixed;}'