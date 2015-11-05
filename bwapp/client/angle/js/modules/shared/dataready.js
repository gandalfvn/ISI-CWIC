cDataReady = (function () {
    function cDataReadyDef(readylim, cb) {
        this.readylim = readylim;
        this.cb = cb;
        this.ready = [];
    }
    cDataReadyDef.prototype.update = function (data) {
        console.warn('data ready ', data, (new Date).getTime());
        this.ready.push(data);
        if (this.ready.length > this.readylim)
            return this.cb();
    };
    ;
    return cDataReadyDef;
})();
//# sourceMappingURL=dataready.js.map