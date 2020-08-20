/*
    CSVe Stage 3 Priviledged Worker-thread bootstrapper
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

log('Stage 3 reached');
let r = {}
this.callbackE0 = ({ id, args }) => {
    r && r[id] && r[id](args);
}; 
this.invoke = ({ name, args }) => {
    let id = Math.random().toString().slice(2);
    sendEvent('invoke', { name, args, id });
    return new Promise((res) => r[id] = res);
}




(async () => {
    // Now time for epoll
    await this.invoke({ name: 'reval', args:`(()=>{
    let evs = [];
    globalThis.events = evs;
    this.fire = (eventId, data) => { console.log(eventId, data); evs.push([Date.now(), eventId, data]) } 
    Core.gxpose('epoll/start', () => evs.length);
    Core.gxpose('epoll/poll', ({ off }) => {
        if (off < evs.length) return { type: evs[off][1], data: evs[off][2] };
        return new Promise((res) => {
            let id = setInterval(() => {
                if (off < evs.length) {
                    res({ type: evs[off][1], data: evs[off][2] });
                    clearInterval(id);
                }
            }, 10);
        })
    })
    let old = 0;
    setInterval(() => {
        for (let j = 0;j < old;j++) delete evs[j];
        old = evs.length;
    }, 500);
    Core.gxpose('pshcsv', (a) => { console.log(a); fire('csvrenderrequest', a) });
    Core.gxpose('fire', ({ e, v }) => { fire(e, v) });
    Core.gxpose('vfs/read', (file) => {
        try {
            return { status: true, result: BaseVFS.read(file) };
        } catch(e) {
            return { result: e.message };
        }
    });
    Core.gxpose('vfs/write', (c) => {
        try {
            BaseVFS.write(c.file, c.data);
        } catch (e) { return { result: e.message } }
        return { status: true };
    });
    Core.gxpose('vfs/cache', async (c) => {
        try {
            await BaseVFS.cache(c);
        } catch (e) { return { result: e.message } }
        return { status: true };
    });
    Core.gxpose('blowfuse', async (c) => {
        try {
            localStorage.setItem('fuses', localStorage.fuses.replace('[' + c + ']', ''));
        } catch (e) { return { result: e.message } }
        return { status: true };
    });
    Core.gxpose('dtheme', async (c) => {
        try {
            let el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = BaseVFS.mkURIText(c.css);
            document.body.append(el);
        } catch (e) { return { result: e.message } }
        return { status: true };
    });
    let sm = new Map();
    Core.gxpose('getopt', async (c) => {
        return sm.get(c.id).current;
    });
    Core.gxpose('mkdopt', async (c) => {
        if (sm.has(c.id)) console.warn(\`The setting ${c.id} was re-declared for this session!\`);
        sm.set(c.id, { current: c.dval, name: c.name, type: c.type })
    });
    setTimeout(() => {
        Core.createCore('marketplace')
        .run('marketplace @ v0.1.0  rt.js', BaseVFS.mkURIText(BaseVFS.read('marketplace/rt.js')), true).exposeFn('getsm', () => sm).exposeFn('setsm', (sm2) => void (sm = sm2));
    }, 500);
})()`})
    
})();
