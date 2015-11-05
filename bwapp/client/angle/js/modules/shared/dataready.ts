/**
 * Created by wjwong on 11/5/15.
 */
interface iDataReady {
  update:(data:string)=>void
}

declare var cDataReady:any;

cDataReady = class cDataReadyDef{
  private ready:string[];
  private readylim:number;
  private cb:() => void;

  constructor(readylim:number, cb:()=>void) {
    this.readylim = readylim;
    this.cb = cb;
    this.ready = [];
  }

  update(data:string):void {
    console.warn('data ready ', data, (new Date).getTime());
    this.ready.push(data);
    if (this.ready.length > this.readylim) return this.cb();
  };
};
