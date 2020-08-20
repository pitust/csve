/*
    CSVe CSV Rendering Module
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
try {
    let emitCache = new Map();
    let parseCache = new Map();
    function hline(line, meta) {
        if (line == '') return [];
        if (parseCache.has(meta + '\n' + line)) return parseCache.get(meta + '\n' + line);
        let o = [''];
        let state = 0;
        for (let c of line) {
            if ((state == 0 || state == 2) && c == '"') { state = -(state - 2); continue; }
            if ((state == 0 || state == 2) && c == '\\') { o[o.length - 1] += c; state += 1; }
            else if (state == 0 && c == ',') o.push('');
            else if (state == 0 || state == 2) o[o.length - 1] += c;
            else if (state == 1) { state = 0; o[o.length - 1] += c; }
            else if (state == 3) { state = 3; o[o.length - 1] += c; }
        }
        parseCache.set(meta + '\n' + line, o);
        return o;
    }
    function render(line, meta, tt, lid) {  
        return '<tr>' + line.map((e, i) => {
            if (lid == 0 && !meta.hasNameRow) return '';
            if (lid == 1 && !meta.hasTypeRow) return '';
            let type = tt[i];
            if (lid < 2) type = 'String';
            if (type == 'Inline') { type = e.split('|')[0]; e = e.split('|').slice(1).join('|'); }
            if (type == 'String')
                return `<td><div><input type="text" oninput="fire('push-change', [this.value, ${lid}, ${i}])" value=${JSON.stringify(e)}/></div></td>`;
            if (type == 'ROString')
                return `<td><div><pre>${e}</pre></div></td>`;
            if (type == 'Boolean')
                return `<td><div class="checkbox on-${e.toUpperCase() != 'FALSE'}" onclick="ccell(this, ${lid}, ${i})"></div><td>`;
            if (type == 'Trigger') return `<td><button onclick='fire(${JSON.stringify(e.split('|')[0])}, null)'><pre>${e.split('|').slice(1).join('|')}</pre></button></td>`;
            return `<td>E: ${type}</td>`;
        }).join('') + '</tr>';
    }
    function e2eline(line, meta, type, lid) {
        return render(hline(line, JSON.stringify(meta)), meta, type, lid);
    }
    function e2eall(lines, meta) {
        
    }
    let csvcur;
    handle('csvrenderrequest', ({ csv, cfg, selector }) => {
        csvcur = csv;
        try {
            let csvs = csv.split('\n');
            let tinfo = hline(csvs[1], 'for-tinfo');
            let result = '<table>' + csvs.map((e, i) => e2eline(e, cfg, tinfo, i)).join('') + '</table>'
            invoke({ name: 'csvrendered', args: { to: selector, text: result } });
        } catch(e) {
            console.log(e);
        }
    })
    handle('request-code', ({ to }) => {
        try {
            fire(to, csvcur);
        } catch(e) {
            console.log(e);
        }
    })
    handle('push-change', ([text, x, y]) => {
        try {
            let splt = csvcur.split('\n');
            let lp = hline(splt[x], 'for-mod');
            lp[y] = text;
            splt[x] = lp.map(e => `${JSON.stringify(e).replace(/\\\\/g, '\\')}`).join(',');
            csvcur = splt.join('\n');
        } catch(e) {
            console.log(e);
        }
    })
} catch(e) {
    log(e);
}
