/*
    CSVe API Bootstrapper
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
(async function () {
    let r = {};
    this.callbackE0 = ({ id, args }) => {
        r && r[id] && r[id](args);
    }; 
    function gid() {
        let id = '';
        while(id.length < 32) id += Math.random().toString(36).slice(2);
        return id.slice(0, 32);
    }
    this.invoke = ({ name, args }) => {
        let id = gid();
        sendEvent('invoke', { name, args, id });
        return new Promise((res) => r[id] = res);
    }
    this.fire = (event, data) => invoke({ name: 'fire', args: { e: event, v: data } })
    this.Util = new (class Util {
        unwrap({ status, result }) {
            if (status) return result;
            throw new Error(result);
        }
    })();
    this.BlowFuse = (name) => invoke({ name: 'blowfuse', args: { name } })
    let tt = [];
    this.handle = (type, handle) => tt.push({ type, handle });
    async function eloop() {
        let off = await invoke({ name: 'epoll/start', args: {} });
        while (true) {
            let x = await invoke({ name: 'epoll/poll', args: { off } })
            tt.filter(e => e.type == x.type).forEach(e => e.handle(x.data))
            off++;
        }
    }
    eloop();
    this.Render = new (class RenderAPI {
        async pushCSVTo(selector, id, cfg, csv, triggers) {
            let _id = gid();
            
            tt.push(...triggers.map(e => ({ type: _id + e.type, handle: e.handle })));
            log('boutto');
            invoke({ name: 'pshcsv', args: { selector, id, elid: _id, cfg, csv: triggers.reduce((csvc, t) => csvc.replace(`{{${t.type}}}`, _id + t.type), csv) } })
            return _id;
        }
    })();
    this.DefineTheme = (name, css) => invoke({ name:'dtheme', args: { name, css } })
    this.Settings = new (class Settings {
        mkopt(id, name, dval, type) {
            return invoke({ name: 'mkopt', args: { name, type, id, dval } });
        }
        getopt(id) {
            return invoke({ name: 'getopt', args: { id } })
        }
        handle(kid, evh) {
            handle('keybind-' + kid, () => evh());
        }
    })();
    this.VFS = {
        async read(file) {
            return Util.unwrap(await invoke({ name: 'vfs/read', args: file }));
        },
        async cache(file) {
            return Util.unwrap(await invoke({ name: 'vfs/cache', args: file }));
        },
        async write(file, data) {
            return Util.unwrap(await invoke({ name: 'vfs/write', args: { file, data } }));
        }
    }
    log('API OK');
})();
