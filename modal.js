(() => {

    const TEMPLETE_DB_NAME = 'Templetes';
    const TEMPLETE_DB_VERSION = 1;

    /**
     * get a item the staorage.sync
     * @param {string: item name in storage} item 
     * @returns Promise: resolve for item in storage
     */
    const getStorage = (item) => {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(item, (res) => {
                if (chrome.runtime.lastError)
                    return reject(chrome.runtime.lastError);
                else if (res[item])
                    resolve(res[item]);
                else resolve([]);
            });
        });
    }

    const updateTempleteDB = (db, bk) => {
        console.log(`Upgrading to version ${db.version}`);

        if (db.objectStoreNames.contains(TEMPLETE_DB_NAME)) db.deleteObjectStore(TEMPLETE_DB_NAME);

        if (!db.objectStoreNames.contains(TEMPLETE_DB_NAME)) {

            const store = db.createObjectStore(TEMPLETE_DB_NAME, {
                autoIncrement: true,
                keyPath: "id"
            });

            store.createIndex('id', 'id', { unique: true });

            store.transaction.oncomplete = async (event) => {

                const db = event.target.db;
                //console.info(event.target.db);
                console.log(`initializing DB for version ${db.version}`);
                
                const getLocalStorage = (item) => {
                    return new Promise((resolve, reject) => {
                        chrome.storage.sync.get(item, (res) => {
                            if (chrome.runtime.lastError)
                                return reject(chrome.runtime.lastError);
                            else if (res[item])
                                resolve(res[item]);
                            else resolve([]);
                        });
                    });
                }

                const templetesLocalStore = await getLocalStorage('templetes');

                templetesLocalStore.forEach((t) => bk.push({ title: t.title, content: t.content }));

                const trans = db.transaction(TEMPLETE_DB_NAME, 'readwrite');
                const store = trans.objectStore(TEMPLETE_DB_NAME);
                trans.oncomplete = () => db.close();
                return Promise.all(bk.map((templete) => {
                    const query = store.add(templete);
                    return new Promise((resolve, reject) => {
                        query.onsuccess = (event) => resolve(event.target.result);
                        query.onerror = (event) => reject(`Database error: ${event.target.errorCode}`);
                    });
                }));

            }
        }
    }

    const getDB = async (dbName, newVersion, updateDB) => {

        const databases = await window.indexedDB.databases();

        return new Promise((resolve, reject) => {

            const requestV = databases.find(i => i.name === dbName)
                ? window.indexedDB.open(dbName)
                : window.indexedDB.open(dbName, newVersion, updateDB);
            requestV.onupgradeneeded = (event) => updateDB(event.target.result, []);
            requestV.onerror = (event) => reject(`Database error: ${event.target.errorCode}`);

            requestV.onsuccess = (event) => {
                const dbV = event.target.result;
                console.log(dbV.version);
                if (newVersion <= dbV.version) return resolve(dbV);
                else {
                    const trans = dbV.transaction(dbName, 'readwrite');
                    console.log('readwrite');
                    const store = trans.objectStore(dbName);
                    trans.oncomplete = () => dbV.close();
                    const query = store.getAll();
                    query.onerror = (event) => reject(`Database error: ${event.target.errorCode}`);
                    query.onsuccess = (event) => {
                        const allTempletes = event.target.result;
                        const requestDB = window.indexedDB.open(dbName, newVersion, updateDB);
                        requestDB.onerror = (event) => reject(`Database error: ${event.target.errorCode}`);
                        if (updateDB) requestDB.onupgradeneeded = (event) => {
                            updateDB(event.target.result, allTempletes);
                        }
                        requestDB.onsuccess = (event) => resolve(event.target.result);
                    }
                }
            }
        });
    }

    const saveTemplete = (db, templete) => {

        const trans = db.transaction(TEMPLETE_DB_NAME, 'readwrite');
        const store = trans.objectStore(TEMPLETE_DB_NAME);
        const query = store.put(templete);

        return new Promise((resolve, reject) => {
            query.onsuccess = (event) => { resolve(event.target.result); };
            query.onerror = (event) => { reject(`Database error: ${event.target.errorCode}`); };
            trans.oncomplete = () => { db.close() }
        });
    }

    const createTemplete = (templet, enfoqued) => {
        const item = document.createElement('li');
        item.id = templet.id;
        const title = document.createElement('button');
        title.innerText = templet.title;
        title.onclick = () => {
            enfoqued.innerHTML = templet.content;
            closeModal();
        }
        item.appendChild(title);
        return item;
    }

    /*
    <div id="modalTempletes">
        <ul>
            <li id="tid0">
                <button>templete title</button>  
            </li>
        </ul>
    </div>
    */
    const showModal = async () => {
        const enfoqued = document.body.querySelector('*:focus'); // *::selection
        const modal = document.createElement('div');
        modal.id = 'EQ39ModalTempletes';
        modal.onclick = closeModal;
        const modalContent = document.createElement('div');
        modalContent.id = 'EQ39ModalDialog';
        modalContent.onclick = (e) => e.stopPropagation();
        const close = document.createElement('button');
        close.innerText = 'X';
        close.onclick = closeModal;
        modal.appendChild(close);
        const templetesList = document.createElement('ul');
        const allTempletes = await getStorage('templetes');
        allTempletes.map((templet) => {
            templetesList.appendChild(createTemplete(templet, enfoqued));
        });
        modalContent.appendChild(close);
        modalContent.appendChild(templetesList);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    const closeModal = async () => {
        const modal = document.getElementById('EQ39ModalTempletes');
        if (modal) {
            const db = await getDB(TEMPLETE_DB_NAME, TEMPLETE_DB_VERSION, updateTempleteDB);
            console.log(
                await saveTemplete(db, {
                    title: `Prueva v${TEMPLETE_DB_VERSION}`,
                    content: `Content prueva DB Templete v${TEMPLETE_DB_VERSION}`
                })
            );
        }
        if (modal) document.body.removeChild(modal);

    }
    showModal();
})();