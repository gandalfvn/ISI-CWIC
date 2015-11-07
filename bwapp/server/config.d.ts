/**
 * Created by wjwong on 11/6/15.
 */
interface iServerConfig{
  mturk:{
    access: string,
    secret: string,
    sandbox: boolean
  }
}

declare var serverconfig:iServerConfig;