/**========================================================
 * Module: config.ts
 * Created by wjwong on 11/3/15.
 =========================================================*/
interface iServerConfig{
 mturk:{
  access: string,
  secret: string,
  sandbox: boolean
 }
}

declare var serverconfig:iServerConfig;

serverconfig = {
 mturk: {
  access: '',
  secret: '',
  sandbox: true
 }
};