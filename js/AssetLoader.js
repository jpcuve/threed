function AssetLoader(callback){
    this.map = {};
    this.count = 0;
    this.callback = callback;
}

AssetLoader.prototype.add = function(id, type, url, url2){
    this.map[id] = {
        type: type,
        url: url,
        url2: url2
    };
};

AssetLoader.prototype.dec = function(){
    this.count--;
    if (this.count <= 0){
        this.callback(this.map);
    }
};

AssetLoader.prototype.load = function(){
    this.count = 0;
    var key, val, that = this;
    for (key in this.map){
        if (this.map.hasOwnProperty(key)){
            this.count++;
            val = this.map[key];
            (function(o){
                switch (o.type){
                    case 'binary':
                        var xhr = new XMLHttpRequest();
                        xhr.responseType = 'arraybuffer';
                        xhr.open('GET', o.url, true);
                        xhr.onload = function(){
                            o.asset = new Uint8Array(xhr.response);
                            that.dec();
                        };
                        xhr.send();
                        break;
                    case 'texture':
                        new THREE.TextureLoader().load(o.url, function(texture){
                            o.asset = texture;
                            that.dec();
                        });
                        break;
                    case 'objmtl':
                        new THREE.OBJMTLLoader().load(o.url, o.url2, function(object){
                            o.asset = object;
                            that.dec();
                        });
                        break;
                }

            })(val);
        }
    }
};
