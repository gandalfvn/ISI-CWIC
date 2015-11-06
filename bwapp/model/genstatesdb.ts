/**========================================================
 * Module: genstatesdb.js
 * Created by wjwong on 9/11/15.
 =========================================================*/
/// <reference path="../server/typings/meteor/meteor.d.ts" />

interface iGenStates {
  _id: string,
  block_meta: iBlockMeta,
  block_states: iBlockStates[],
  public: boolean,
  created: number,
  creator: string,
  name: string
}

interface iBlockStates{
  created?: number,
  screencapid?: string,
  block_state: iBlockState[]
}

interface iBlockState{
  id: number,
  position: iPosRot,
  rotation?: iPosRot
}

interface iPosRot{
  [x: string]: number
}

interface iBlockMeta {
  blocks: Array<{
    name: string,
    id: number,
    shape: iShapeMeta
  }>
}

interface iShapeMeta{
  type: string,
  size: number,
  shape_params: {
    face_1: iFaceEle
    face_2: iFaceEle
    face_3: iFaceEle
    face_4: iFaceEle
    face_5: iFaceEle
    face_6: iFaceEle
  }
}

interface iFaceEle{
  color: string,
  orientation: number
}

declare var GenStates:any;
GenStates = new Mongo.Collection('genstates');

