// ==UserScript==
// @name         Tradable item counter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Count tradable assets from inventory and market
// @author       SmallTailTeam
// @match        https://steamcommunity.com/market/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steamcommunity.com
// @grant GM_xmlhttpRequest
// @require     https://cdn.jsdelivr.net/npm/@trim21/gm-fetch
// ==/UserScript==

const appId = 730;
const contextId = 2;
let button;

(async function() {
    'use strict';

    var container = document.querySelector('#myMarketTabs');

    button = document.createElement('button')
    button.innerHTML = 'Загрузить трейдабильность';
    button.style.right = '150px';
    button.style.bottom = '8px';
    button.style.position = 'absolute';
    button.style.outline = 'none';
    button.style.background = '#2b475e';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.fontSize = '13px';
    button.style.padding = '5px 6px';
    button.style.borderRadius = '3px';
    button.style.cursor = 'pointer';

    container.appendChild(button)

    button.onclick = load;
})();

async function load() {
    let assets = [];

    button.disabled = true;

    await loadMarketListings(assets);
    await loadInventory(assets);

    button.disabled = false;

    display(assets);
}

async function loadMarketListings(assets) {
    let start = 0;
    let total = 0;
    let count = 100;

    do {
        let response = await fetch(`https://steamcommunity.com/market/mylistings/render/?query=&start=${start}&count=${count}?l=russian`);
        let json = await response.json();

        if (json.assets[appId] !== undefined) {
            Object.values(json.assets[appId][contextId]).forEach(asset => {
                if (asset.owner_descriptions !== undefined) {
                    assets.push({
                        name: asset.name,
                        tradableAfter: asset.owner_descriptions.find(x => x.value.includes('Можно будет передать другим после')).value
                    })
                }
            });
        }

        console.log(`Загружаю торговую -> ${start}/${json.total_count}`)

        start += count;
        total = json.total_count;
    } while (start < total);
}

async function loadInventory(assets) {
    let response = await fetch(`https://steamcommunity.com/inventory/${g_steamID}/${appId}/${contextId}?l=russian&count=2000`);
    let json = await response.json();

    console.log(`Загружаю инвентарь -> ${json.assets.length}/${json.total_inventory_count}`);

    json.assets.forEach(asset => {
        let description = json.descriptions.find(d => d.classid === asset.classid);

        if (description.owner_descriptions) {
            let tradableAfter = description.owner_descriptions.find(x => x.value.includes('Можно будет передать другим после'));

            if (tradableAfter) {
                assets.push({
                    name: description.name,
                    tradableAfter: tradableAfter.value
                })
            }
        }
    });
}

function display(assets) {
    var grouped = {};

    assets.forEach(a => {
        var key = a.tradableAfter;

        if (!grouped[key]) {
            grouped[key] = [];
        }

        grouped[key].push(a);
    });

    var bg = document.querySelector('#BG_bottom');

    let container = document.createElement('div');
    container.style.background = '#101822';
    container.style.padding = '6px';
    container.style.marginTop = '30px';

    bg.insertBefore(container, bg.firstChild);

    Object.keys(grouped).forEach(key => {
        var label = document.createElement('div');

        label.innerHTML = `${key} -> ${grouped[key].length}`;

        container.appendChild(label);
    })
}
