/**
 * Created by wjwong on 11/5/15.
 */
cDataReady = (function () {
    function cDataReadyRef(readylim, cb) {
        this.readylim = readylim;
        this.cb = cb;
        this.ready = [];
    }
    cDataReadyRef.prototype.update = function (data) {
        console.warn('data ready ', data, (new Date).getTime());
        this.ready.push(data);
        if (this.ready.length > this.readylim)
            return this.cb();
    };
    ;
    return cDataReadyRef;
})();
//# sourceMappingURL=dataready.js.map