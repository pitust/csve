/*
    CSVe Recovery Module
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

let t = new Map();
function gid() {
    let id = '';
    while(id.length < 32) id += Math.random().toString(36).slice(2);
    return id.slice(0, 32);
}
onmessage = ({data}) => { if (data.verbose) log(JSON.stringify(data)); t.get(data.gid)[(data.isok || data.data) ? 'res' : 'rej'](data.data || data.err) }
function gidtuple() {
    let cgid = gid();
    return {
        rgid: cgid,
        prom: new Promise((res, rej) => { t.set(cgid, { res, rej }); })
    }
}
async function wrapo(obj) {
    let t = gidtuple();
    postMessage({ responseGID: t.rgid, ...obj });
    return t.prom;
}
function pledge(file) { wrapo({ type: 'pledge', file }); }
function log(msg) { wrapo({ type: 'log', file: msg }); }
function sreboot() { wrapo({type: 'sreboot'}); }
function proprompt(isOneLetter, prompt) { return wrapo({ type: 'proprompt', file: (+!!isOneLetter).toString() + prompt }); }
function read(file) { return wrapo({ type: 'read', file })}
function write(file, data) { return wrapo({ type: 'write', file, data}); }
function list(dir) { return wrapo({ type: 'list', file: dir }); }

(async () => {
    let r = await proprompt(true, 'Did you want to enter recovery? [y/N] ');
    if (r == 'n') {
        log('Alright, going back to CSVe');
        sreboot();
    } else if (r == 'y') {
        for (let p of await list('/core')) {
            log('WARNING: ' + p + ' was left after rcm.1!!!');
        }
        for (let p of await list('/marketplace')) {
            log('WARNING: ' + p + ' was left after rcm.1!!!');
        }
        let cdir = '/';
        log('Entering resh');
        let fusestt = [];
        while (true) {
            try {
                let cmd = (await proprompt(false, 'resh ' + cdir + '$ ') || "");
                cmd = cmd.split('#')[0].trim();
                if (cmd == 'sreboot') { sreboot(); break; }
                if (cmd == 'ls') {
                    for (let f of await list(cdir)) log(f);
                    continue;
                }
                if (cmd.startsWith('pledge ')) {
                    let dir = null;
                    if (cmd[7] == '/') {
                        dir = cmd.slice(7);
                    } else dir = cdir + '/' + cmd.slice(7);
                    dir = dir.replace(/\/+/g, '/');
                    for (let i = 0;i < 20;i++)dir = dir.replace(/\/[^\/]+\/\.\./g, '/');
                    dir = dir.replace(/\/+/g, '/');
                    await pledge(dir);
                    continue;
                }
                if (cmd.startsWith('ld.css ')) {
                    let dir = null;
                    if (cmd[7] == '/') {
                        dir = cmd.slice(7);
                    } else dir = cdir + '/' + cmd.slice(7);
                    dir = dir.replace(/\/+/g, '/');
                    for (let i = 0;i < 20;i++)dir = dir.replace(/\/[^\/]+\/\.\./g, '/');
                    dir = dir.replace(/\/+/g, '/');
                    wrapo({ type: 'ld.css', file: URL.createObjectURL(new Blob([await read(dir)])) });
                    continue;
                }
                if (cmd.startsWith('cache ')) {
                    await wrapo({ type: 'cache', data: cmd.slice(6) });
                    continue;
                }
                if (cmd == 'proceed') {
                    log('rcm.2', 'Proceeding');
                    wrapo({ type: 'proceed' });
                    break;
                }
                if (cmd == 'fuses rearm') {
                    wrapo({ type: 'rearm-fuses' });
                    continue;
                }
                if (cmd == 'fuses push') {
                    fusestt.push(await wrapo({ type: 'list-fuses' }));
                    continue;
                }
                if (cmd == 'fuses pop') {
                    let e = await wrapo({ type: 'list-fuses' });
                    let f = fusestt.pop() || [];
                    for (let ftb of e) {
                        if (!f.includes(ftb)) {
                            log('Blowing fuse ' + ftb);
                            wrapo({ type: 'blow-fuse', data: ftb });
                            f = f.filter(e => e != ftb);
                        }
                    }
                    for (let nbf of f) {
                        if (!e.includes(nbf))
                            log('Unable to correct fuse ' + nbf + ' as it is BLOWN and popped state would be ARMED');
                    }
                    continue;
                }
                if (cmd == 'fuses popadd ') {
                    fusestt[fusestt.length - 1].push(cmd.slice(13));
                }
                if (cmd.startsWith('fuses arm ')) {
                    if (!(await wrapo({ type: 'list-fuses' })).includes('devel')) {
                        log('Not a developer; fuse not armed');
                        continue;
                    }
                    wrapo({ type: 'arm-fuse', data: cmd.slice(10) });
                    continue;
                }
                if (cmd == 'fuses list') {
                    for (let f of await wrapo({ type: 'list-fuses' })) log('Fuse: ' + f);
                    continue;
                }
                if (cmd.startsWith('fuses blow ')) {
                    wrapo({ type: 'blow-fuse', data: cmd.slice(11) });
                    continue;
                }
                if (cmd.startsWith('ls ')) {
                    let dir = null;
                    if (cmd[3] == '/') {
                        dir = cmd.slice(3);
                    } else dir = cdir + '/' + cmd.slice(3);
                    dir = dir.replace(/\/+/g, '/');
                    for (let i = 0;i < 20;i++)dir = dir.replace(/\/[^\/]+\/\.\./g, '/');
                    dir = dir.replace(/\/+/g, '/');
                    for (let f of await list(dir)) log(f);
                    continue;
                }
                if (cmd.startsWith('cat ')) {
                    dir = cdir + '/' + cmd.slice(4);
                    dir = dir.replace(/\/+/g, '/');
                    for (let i = 0;i < 20;i++)dir = dir.replace(/\/[^\/]+\/\.\./g, '/');
                    dir = dir.replace(/\/+/g, '/');
                    log(await read(dir));
                    continue;
                }
                if (cmd.startsWith('cd ')) {
                    dir = cdir + '/' + cmd.slice(3);
                    dir = dir.replace(/\/+/g, '/');
                    for (let i = 0;i < 20;i++)dir = dir.replace(/\/[^\/]+\/\.\./g, '/');
                    cdir = dir.replace(/\/+/g, '/');
                    continue;
                }
                log('Unknown command: ' + cmd.split(' ')[0]);
            } catch(e) {
                log('error: ' + (e && e.stack || e));
                console.error(e);
            }
        }
    } else {
        log('Invalid answer: ' + JSON.stringify(r));
        sreboot()
    }
})().catch(e => log('error: ' + (e && e.stack || e) ));




