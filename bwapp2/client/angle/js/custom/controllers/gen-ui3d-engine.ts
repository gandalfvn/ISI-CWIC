/**
 * Created by wjwong on 12/15/15.
 */
/// <reference path="gen-3d-engine.ts" />
  
/*ignoring Error:(6, 27) TS2507: Type 'any' is not a constructor function type.
because mgen3dengine is the content of the interface of migen3dengine.  This was only way to get modules to work
 */
class cUI3DEngine extends mGen3DEngine.c3DEngine{
  constructor(fieldsize:number){
    super(fieldsize);
  }
}