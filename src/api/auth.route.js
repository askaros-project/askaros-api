const log = require('../services/log')('auth.route');
import User from '../models/user.model'
import CONST from '../const'
import jwt from "jwt-simple"
import _ from "lodash";
import config from '../config'

const AuthRoute = {
  signup: (req, res) => {
    User.createWithEmail(req.body)
        .then(() => {
          log.info('User have been successfully signed up');
          return res.sendSuccess()
        })
        .catch((err) => {
          return res.sendError(err)
        })
  },

  signin: (req, res) => {
    const { login, password } = req.body;

    if( !login || !password ) {
      return res.sendError(CONST.ERROR.WRONG_LOGIN_OR_PASSWORD, 400)
    }

    User.findOne({ provider: 'email', login:login })
      .then( ( user ) => {
        if (!user) {
          return res.sendError(CONST.ERROR.USER_NOT_FOUND, 400)
        }
        return User.comparePassword(password, user.passwordOrToken)
          .then((isValid)=>{
            if(isValid){
              let now = new Date().getTime();
              let payload = {
                _id: user._id,
                expire: now + config.SECURITY.VALID_DAYS*24*60*60*1000
              };
              log.info('User have been successfully signed in', user._id);
              let token =  jwt.encode(payload, config.SECURITY.JWT_SECRET);
              return res.sendSuccess({token})
            } else {
              return res.sendError(CONST.ERROR.WRONG_LOGIN_OR_PASSWORD, 400)
            }
          })
      })
      .catch((err) => {
        return res.sendError( err );
      })
  }

}

export default AuthRoute