/**
 * Created by jpc on 12/1/15.
 */

THREE.Vector3.prototype.rotz44 = function(r){
    "use strict";
    var x = this.x, y = this.y, z = this.z;
    switch(r % 4){
        case 1:
            this.set(7 - y, x, z);
            break;
        case 2:
            this.set(7 - x, 7 - y, z);
            break;
        case 3:
            this.set(y, 7 - x, z);
            break;
    }
};



function Player(brushData, screenData){
    "use strict";
    this.brushes = {};
    this.screens = {};
    this.debug = false;
    this.layouts = ['basic', 'extruded', 'basic', 'column', 'special'];
    this.floor = new Uint8Array(65 * 2).fill(0);
    var brushCount = 0, screenCount = 0, offset, l, i, j;
    offset = 0;
    while (offset < brushData.length){
        l = brushData[offset + 1];
        this.brushes[brushData[offset]] = brushData.slice(offset, offset + l);
        offset += l;
        brushCount++;
    }
    if (this.debug){
        console.log('brush count:', brushCount);
    }
    offset = 0;
    while (offset < screenData.length){
        l = screenData[offset];
        j = screenData[offset + 1];
        i = screenData[offset + 2];
        if ((i & 0x80) !== 0){
            i -= 0x80;
            this.start = new THREE.Vector2(i, j);
        }
        this.screens[(j << 8) + i] = screenData.slice(offset, offset + l);
        offset += l;
        screenCount++;
    }
    if (this.debug){
        console.log('screen count:', screenCount);
    }
}

Player.prototype.terrain = function(paint, po, ro, buffer, offset, level){
    "use strict";
    var l, p, r, nature, type;
    while ((l = buffer[offset] + (buffer[offset + 1] << 8)) != 0){
        p = new THREE.Vector3(l >> 10 & 7, l >> 13 & 7, l >> 7 & 7);
        var f = l & 0x7F, m = f >> 5, t = f >> 2 & 7;
        if ((f & 0x1F) === 2) { // brush
            var index = buffer[offset + 2], brush = this.brushes[index];
            r = (l >> 5) & 3;
            if (this.debug){
                console.log('local brush: (', p.x, ',', p.y, ',', p.z, ')r:' , r);
            }
            p.add(po);
            if (this.debug){
                console.log(level + 1, '> brush:', index);
            }
            this.terrain(paint, p, ro + r, brush, 2, level + 1);
            if (this.debug){
                console.log(level + 1, '> end brush:', index);
            }
            offset++;
        } else {
            r = 0;
            nature = 'undefined';
            type = 0;
            switch(f){
                case 1:
                case 0x21:
                case 0x61:
                    nature = 'block';
                    break;
                case 3:
                case 0x23:
                case 0x63:
                    nature = 'trampoline';
                    break;
                case 0x40:
                    nature = 'water';
                    break;
                case 0x43:
                    nature = 'ice';
                    break;
                default:
                    if ((f & 0x70) === 0x50){
                        nature = 'clue';
                        type = f & 0xF;
                    } else if ((f & 0x7C) === 0x44){
                        nature = 'arrow';
                        r = f & 3;
                    } else {
                        nature = 'slope';
                        type = t;
                        if (t < 1){
                            throw 'invalid slope type, f=' + f;
                        }
                        r = f & 3;
                    }
                    break;
            }
            if (this.debug){
                console.log('local block: (', p.x, ',', p.y, ',', p.z, ')r:' , r);
            }
            p.add(po);
            p.rotz44(ro); // apply rotation
            paint(this.layouts[m], p, ro + r, nature, type);
        }
        offset += 2;
    }
    return offset + 2;
};

Player.prototype.special = function(paint, po, ro, buffer, offset){
    "use strict";
    var l, p, nature;
    while (buffer[offset] != 0){
        l = buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
        p = new THREE.Vector3(l >> 10 & 7, l >> 13 & 7, l >> 7 & 7);
        nature = 'undefined';
        if ((l & 0x7F) === 1){
            nature = 'jewel';
        } else if ((l & 0x7) === 2){
            nature = 'lift';
        } else if ((l & 0x77) === 3){
            nature = 'enemy';
        } else if ((l & 4) === 4){
            nature = 'puzzle';
        }
        paint(this.layouts[4], new THREE.Vector3().addVectors(po, p), ro, nature, l);
        offset += 3;
    }
    return offset;
};

Player.prototype.screen = function(paint, p, ro){
    "use strict";
    var screen = this.screens[(p.y << 8) + p.x], offset, xo, yo, x, y;
    if (screen) {
        if (this.debug){
            console.log('0 > screen:', p.x, p.y);
        }
        if (screen[4]){
            xo = screen[5] >> 2 & 7;
            yo = screen[5] >> 5 & 7;
            offset = 0;
            this.floor.fill(0);
            for (x = xo; x < 8 - xo; x++){
                for (y = yo; y < 8 - yo; y++){
                    this.floor[offset] = screen[4];
                    this.floor[offset + 1] =  (y << 5) + (x << 2) + (screen[5] & 3);
                    offset += 2;
                }
            }
            this.terrain(paint, new THREE.Vector3(), 0, this.floor, 0, 0);
        }
        offset = this.terrain(paint, new THREE.Vector3(), ro, screen, 6, 0);
        offset = this.special(paint, new THREE.Vector3(), 0, screen, offset);
        if (this.debug){
            console.log('0 > end screen:', p.x, p.y);
        }
        return offset;
    }
    return 0;
};

Player.prototype.dump = function(){
    "use strict";
    var x, y, ar;
    for (y = 40; y < 80; y++){
        if (y % 10 == 0){
            console.log("-");
        }
        ar = [];
        for (x = 40; x < 90; x++) {
            if (x % 10 == 0) {
                ar.push(" ");
            }
            if (this.screen(paint, x, y)) {
                ar.push("*");
            } else {
                ar.push(".");
            }
        }
        console.log(ar.join(""));
    }
};


