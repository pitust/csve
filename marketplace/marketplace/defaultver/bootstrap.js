/*
    CSVe Main-thread Bootstrap loader
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
(async () => {
    globalThis.BaseVFS = {
        read(file) {
            if (localStorage.getItem('vfs__' + file)) return localStorage.getItem('vfs__' + file);
            log('marketplace @ v0.1.0  bootstrap.js', `File ${file} does not exist or is not cached`);
            throw new Error('cannot load')
        },
        write(file, data) {
            localStorage.setItem('vfs__' + file, data);
        },
        async cache(pkg) {
            let r = await fetch(`/marketplace/${pkg}/defaultver/files.json`);
            let fls = await r.json();
            for (let f of fls)
                localStorage.setItem('vfs__' + pkg + '/' + f, await (await fetch(`/marketplace/${pkg}/defaultver/${f}`)).text());
        },
        mkURIText(text, mime = 'text/javascript') {
            let b = new Blob([text], { type: mime });
            return URL.createObjectURL(b);
        }
    }
    try {
        BaseVFS.read('marketplace/stage2.js'); if(localStorage.fuses.includes('[nocache]')) throw 'nocache on';
    } catch {
        log('marketplace @ v0.1.0  bootstrap.js', `Caching marketplace...`);
        await BaseVFS.cache('marketplace')
        log('marketplace @ v0.1.0  bootstrap.js', `Cached marketplace.`);
    }
    let d = document.createElement('script');
    d.src = BaseVFS.mkURIText(BaseVFS.read('marketplace/stage2.js'));
    d.type = 'module';
    document.body.appendChild(d);
})()
