/*
    CSVe Real World Application Entrypoint
    Copyright (C) 2020  Piotr Stelmaszek

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
log('Running RT!!!');
(async () => {
    await DefineTheme('main', await VFS.read('marketplace/main.css'));
    await DefineTheme('dark', await VFS.read('marketplace/dark.css'));
    try {
        await VFS.read('core/index.js');
    } catch {
        await VFS.cache('core');
    }
    sendEvent('reval', `
Core.createCore('core')
    .run('core @ v0.1.0  index.js', BaseVFS.mkURIText(BaseVFS.read('core/index.js')), true)
    .exposeFn('csvrendered', info => {
        document.querySelector(info.to).innerHTML = info.text;
    });`);
    setTimeout(async () => {
        let fid;
        fid = await Render.pushCSVTo('.mlauncher', 'mlauncher', { hasNameRow: false, hasTypeRow: false, cellBorders: false }, `,,
ROString,String,Inline
Demo file,ch,Trigger|{{save}}|Save dis csv!`, [
            {
                type: 'save',
                handle() {
                    fire('request-code', { to: fid + 'savecallback' })
                }
            },
            {
                type: 'savecallback',
                handle(csv) {
                    log('CSV:\n' + csv);
                }
            },
        ]);
    }, 100);
})()
