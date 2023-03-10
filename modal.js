(() => {

    const TEMPLETE_DB_NAME = 'Templetes';
    const TEMPLETE_DB_VERSION = 1;

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
                            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                            else if (res[item]) resolve(res[item]);
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
                        query.onsuccess = (e) => resolve(e.target.result);
                        query.onerror = (e) => reject(`Database error: ${e.target.errorCode}`);
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
                if (newVersion <= dbV.version) return resolve(dbV);
                else {
                    const trans = dbV.transaction(dbName, 'readwrite');
                    const store = trans.objectStore(dbName);
                    trans.oncomplete = () => dbV.close();
                    const query = store.getAll();
                    query.onerror = (event) => reject(`Database error: ${event.target.errorCode}`);
                    query.onsuccess = (event) => {
                        const allTempletes = event.target.result;
                        const requestDB = window.indexedDB.open(dbName, newVersion, updateDB);
                        requestDB.onerror = (event) => reject(`Database error: ${event.target.errorCode}`);
                        if (updateDB) requestDB.onupgradeneeded = (e) => updateDB(e.target.result, allTempletes);
                        requestDB.onsuccess = (e) => resolve(e.target.result);
                    }
                }
            }
        });
    }

    const getAllTempletes = async () => {

        const db = await getDB(TEMPLETE_DB_NAME, TEMPLETE_DB_VERSION, updateTempleteDB);
        const trans = db.transaction(TEMPLETE_DB_NAME, 'readwrite');
        const store = trans.objectStore(TEMPLETE_DB_NAME);
        trans.oncomplete = () => db.close();
        const query = store.getAll();

        return new Promise((resolve, reject) => {
            query.onerror = (e) => reject(`Database error: ${e.target.errorCode}`);
            query.onsuccess = (e) => resolve(e.target.result);
        });
    }

    const saveTemplete = async (templete) => {

        const db = await getDB(TEMPLETE_DB_NAME, TEMPLETE_DB_VERSION, updateTempleteDB);
        const trans = db.transaction(TEMPLETE_DB_NAME, 'readwrite');
        const store = trans.objectStore(TEMPLETE_DB_NAME);
        const query = store.put(templete);

        return new Promise((resolve, reject) => {
            query.onsuccess = (e) => resolve(e.target.result);
            query.onerror = (e) => reject(`Database error: ${e.target.errorCode}`);
            trans.oncomplete = () => db.close();
        });
    }

    const createTemplete = (templet, enfoqued) => {
        const item = document.createElement('li');
        item.id = 'Teid-' + templet.id;
        const title = document.createElement('button');
        title.innerText = templet.title;
        title.onclick = () => {
            enfoqued && (enfoqued.innerHTML = templet.content);
            closeModal();
        }
        item.appendChild(title);
        return item;
    }   

    const showModal = async () => {
        const enfoqued = document.body.querySelector('*:focus'); // *::selection
        const modal = document.createElement('div');
        modal.id = 'EQ39ModalTempletes';
        modal.onclick = closeModal;
        modal.innerHTML = 
        `<div class="dialog">
            <button>X<button>
            <header> </header>
            <ul> </ul>
            <form>
                <input type="text">
                <p contentEditable="true"></p>
                <input type="submit" value="Add">
            </form>
        </div>`;
        document.body.appendChild(modal);
        const modalContent = modal.querySelector('div.dialog');
        modalContent.onclick = (e) => e.stopPropagation();
        const templeteContent = modal.querySelector('div.dialog ul');
        console.log(templeteContent);
        const allTempletes = await getAllTempletes();
        allTempletes.map((t) => templeteContent.appendChild(createTemplete(t, enfoqued)));
        const close = modal.querySelector('div.dialog > button');        
        close.onclick = closeModal;
    }

    const closeModal = async () => {
        const modal = document.getElementById('EQ39ModalTempletes');
        if (modal) document.body.removeChild(modal);

    }
    showModal();
})();