


/**
 * get a item the staorage.sync
 * @param {string: item name in storage} item 
 * @returns Promise: resolve for item in storage
 */
const getStorage = (item) => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(item, (res) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            if (res[item]) resolve(res[item]);
            else resolve([]);
        });
    });
}

/**
 * save templetes in storage
 * @param {string: item name in storage} item 
 * @param {object: data for save in storage} value 
 * @returns object: data saved
 */
const setStorage = (item, value, bd = 'sync') => {
    return new Promise((resolve, reject) => {
        chrome.storage[bd].set({ [item]: value }, () => {
            if (chrome.runtime.lastError)
                return reject(chrome.runtime.lastError);
            else resolve(value);
        });
    });
}

/**
 * remove a item
 * @param {string: item id to remove} itemId 
 */
const removeItem = async (itemId) => {
    const allTempletes = await getStorage('templetes');
    const templetList = document.getElementById('templetList');
    templetList.removeChild(document.getElementById(itemId));
    return setStorage('templetes', allTempletes.filter(templete => templete.id != itemId));
}

const editTemplet = (itemId) => {

}

/**
 * cipy the templete in tehe clipboard
 * @param {*string: id of templet to copied} itemId 
 */
const copiTemplet = (itemId) => {
    const templetContent = document.querySelector('[id="' + itemId + '"]>p');
    const seleccion = document.createRange();
    seleccion.selectNodeContents(templetContent);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(seleccion);
    document.execCommand('copy');
    window.getSelection().removeRange(seleccion);
}

/**
 * Create a new elemnent button icon.
 * @param {*string: phat of icon} phat 
 * @param {*function: calback for set onclick} action 
 * @param {*string: altennative text} alt 
 * @returns element: a new icon button
 */
const crateIcon = (phat, action, alt = 'icon') => {
    const icon = document.createElement('img');
    icon.src = phat;
    icon.alt = alt;
    const iconButton = document.createElement('button');
    iconButton.onclick = action;
    iconButton.appendChild(icon);
    return iconButton;
}

/**
 * add a templete the Dom
 * @param {object: templete for show} templet 
 */
const showTemplet = (templet) => {

    /**
     * <li class="item" id="tid0">
            <button>templete title</button>
            <p>content templete</p>
            <div>
                <button>
                    <img src="icons/name.svg" alt="descriotion icon" />
                </button>
            </div>
        </li>
        
    */
    const item = document.createElement('li');
    item.className = 'item';
    item.id = templet.id;

    const content = document.createElement('p');
    content.innerText = templet.content;

    const title = document.createElement('button');
    title.innerText = templet.title;
    title.onclick = () => setStorage('selection', { content: templet.content }, 'local');

    const seting = document.createElement('div');
    seting.appendChild(crateIcon('icons/trash.svg', () => removeItem(item.id), 'delete templet'));
    seting.appendChild(crateIcon('icons/edit.svg', () => editTemplet(item.id), 'edit templet'));
    seting.appendChild(crateIcon('icons/copi.svg', () => copiTemplet(item.id), 'copi templet'));

    const templetList = document.getElementById('templetList');
    item.appendChild(title);
    item.appendChild(content);
    item.appendChild(seting);
    templetList.appendChild(item);
}

/**
 * Get the form data, add an item on screen and in memory
 */
const addTemplet = async () => {
    const form = document.getElementById('addTemplet');
    const allTempletes = await getStorage('templetes');
    const countTempletes = allTempletes.length;
    const id = countTempletes <= 0 ? 1 : allTempletes[countTempletes - 1].id + 1;
    const title = form.querySelector('input[name="title"]');
    const content = form.querySelector('p[name="content"]');
    const newTemplet = {
        id: id,
        title: title.value,
        content: content.innerHTML
    }
    showTemplet(newTemplet);
    allTempletes.push(newTemplet);
    setStorage('templetes', allTempletes);
    title.value = '';
    content.innerHTML = '';
}


const main = async () => {
    try {
        const allTempletes = await getStorage('templetes');
        const form = document.getElementById('addTemplet');
        allTempletes.map(showTemplet);
        form.onsubmit = (e) => {
            e.preventDefault();
            addTemplet();
        }

    } catch (error) {
        console.error(error);
    }
}

main();
