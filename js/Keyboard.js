function Keyboard(){
    var that = this;
    this.keys = [];
    this.onKeyUp = function(event) {
        var code = event.which || event.keyCode, position;
        while ((position = that.keys.indexOf(code)) >= 0) {
            that.keys.splice(position, 1);
            console.log('key up', event.keyCode);
        }
    };
    this.onKeyDown = function(event){
        var code = event.which || event.keyCode;
        if (that.keys.indexOf(code) < 0){
            console.log('key down', event.keyCode);
            that.keys.push(code);
        }
    };
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
}

Keyboard.prototype.isPressed = function(code){
    return this.keys.indexOf(code) >= 0;
};

Keyboard.prototype.isCharPressed = function(s){
    if (s && typeof(s) == 'string' && s.length > 0){
        return this.isPressed(s.charCodeAt(0));
    }
    return false;
};

Keyboard.prototype.destroy = function(){
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
};
