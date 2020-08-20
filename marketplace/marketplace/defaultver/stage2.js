/*
    CSVe Stage 2 Main-thread Bootstrapper
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
    log('marketplace @ v0.1.0  stage2.js', 'Stage 2 reached');
    class Core {
        constructor(owner) {
            this.owner = owner;
            this.worker = new Worker(BaseVFS.mkURIText('onmessage=({data})=>eval(data);'));
            this.worker.postMessage(
                `onmessage = (x) => {
                    let {ports} = x;
                    var data = ports[0];
                    onmessage=({data})=>eval(data);
                    globalThis.log = (msg) => data.postMessage(msg);
                    data.onmessage=({data}) => eval(data);
                    globalThis.sendEvent = (id, args) => postMessage({ id, args });
                }`
            );
            let ths = this;
            this.worker.onmessage = ({ data: { id, args }}) => {
                this.evt[id](args);
            }
            this.evt = {};
            this.chan = new MessageChannel();
            this.worker.postMessage('', [this.chan.port2]);
            this.hinvoke = {};
            this.exposeEvent('invoke', 
                (({ name, id, args }) => {
                    return Promise.resolve(this.hinvoke[name](args))
                        .then((e => {
                            this.worker.postMessage(`callbackE0(${JSON.stringify({ id, args: e })})`);
                        }).bind(this)).catch(console.error);
                }).bind(this))
        }
        exposeFn(id, fn) {
            this.hinvoke[id] = fn;
        }
        run(name, file, ees = false) {
            if (ees) 
                this.chan.port1.postMessage(`importScripts(${JSON.stringify(BaseVFS.mkURIText(BaseVFS.read('marketplace/apiroot.js')))});importScripts(${JSON.stringify(file)})`);
            else
            this.chan.port1.postMessage(`importScripts(${JSON.stringify(file)})`);
            this.chan.port1.onmessage= ({data}) => log(`${name}`, data);
            return this;
        }
        eval(txt) {
            this.chan.port1.postMessage(txt);
        }
        detach() {
            this.worker.terminate();
            this.worker = null;
        }
        exposeEvent(id, fn) {
            this.evt[id] = fn;
            return this;
        }
    }
    globalThis.Core = new (class CoreAPI {
        constructor() {
            this.cores = [];
            this.gx = [];
        }
        createCore(owner) {
            let nc = new Core(owner);
            this.cores.push(nc);
            for (let [k, v] of this.gx) nc.exposeFn(k, v);
            return nc;
        }
        gxpose(k, v) {
            this.gx.push([k, v]);
            for (let c of this.cores) c.exposeFn(k, v);
        }
    });
})().then(() => {
    Core.createCore('marketplace')
        .run('marketplace @ v0.1.0  stage3.js', BaseVFS.mkURIText(BaseVFS.read('marketplace/stage3.js'))).exposeEvent('reval', code => {
            let s = document.createElement('script');
            s.src = BaseVFS.mkURIText(code);
            s.type = "module";
            document.body.appendChild(s);
        }).exposeFn('reval', eval.bind(this));
});
