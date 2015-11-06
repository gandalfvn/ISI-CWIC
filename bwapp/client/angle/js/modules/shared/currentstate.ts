/**
 * Created by wjwong on 11/5/15.
 */
/// <reference path="../../../../../server/typings/underscore/underscore.d.ts" />
  
declare var cCurrentState:any;

cCurrentState = class cCurrentStateDef{
  _id: string;
  private static l:string[] = ['block_meta', 'block_states', '_id', 'public', 'created', 'creator', 'name'];
  constructor(c?: cCurrentStateDef){
    if(c) this.copy(c);
  }
  clear(){
    for(var i:number = 0; i < cCurrentStateDef.l.length; i++){
      this[cCurrentStateDef.l[i]] = null;
    }
    if(!_.isUndefined(this._id)) delete this['_id'];
  };
  copy(s:cCurrentStateDef){
    for(var i:number = 0; i < cCurrentStateDef.l.length; i++){
      this[cCurrentStateDef.l[i]] = s[cCurrentStateDef.l[i]];
    }
  };
};
